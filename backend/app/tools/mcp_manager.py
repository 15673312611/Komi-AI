"""
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import asyncio
from datetime import timedelta
from typing import List, Optional
from agno.tools.mcp import MCPTools, SSEClientParams, StreamableHTTPClientParams
from app.database import SessionLocal
from app.repositories.mcp_tool import MCPToolRepository
from app.models.mcp_tool import MCPTransportType
from app.core.logger import get_logger

logger = get_logger(__name__)

CONNECT_TIMEOUT_SECONDS = 10.0


class MCPToolsManager:
    """Manager class for handling MCP tools initialization and cleanup"""

    def __init__(self):
        self.mcp_tools: List[MCPTools] = []
        # Names of tools that connected, and {name, error} for those that
        # didn't. Unlike mcp_tools (cleared on cleanup) these survive the run,
        # so callers can report "loaded N of M" afterwards.
        self.connected_tool_names: List[str] = []
        self.failed_tools: List[dict] = []

    async def initialize_mcp_tools_by_ids(
        self, org_id: str, tool_ids: List[int]
    ) -> List[MCPTools]:
        """
        Initialize a specific set of the organization's MCP tools by id —
        used by the ticket investigation worker, whose connector selection
        (organization_ticket_settings.investigation_mcp_tool_ids) is
        deliberately separate from the chat-facing agent associations.
        """
        if not org_id or not tool_ids:
            return []
        try:
            with SessionLocal() as db:
                configs = MCPToolRepository(db).get_by_ids(org_id, tool_ids)
        except Exception as e:
            logger.error(f"Failed to load MCP tools {tool_ids} for org {org_id}: {e}")
            return []
        found_ids = {config.id for config in configs}
        for missing_id in tool_ids:
            if missing_id not in found_ids:
                self.failed_tools.append({
                    "name": f"Tool #{missing_id}",
                    "error": "Configured tool no longer exists or is disabled",
                })
        return await self._initialize_from_configs(configs)

    async def initialize_mcp_tools(self, agent_id: str, org_id: str) -> List[MCPTools]:
        """
        Initialize MCP tools for an agent asynchronously.
        Returns a list of connected MCPTools instances.
        """
        if not agent_id or not org_id:
            return []

        try:
            # Get MCP tools for this agent from database
            with SessionLocal() as db:
                mcp_tool_repo = MCPToolRepository(db)
                agent_mcp_tools = mcp_tool_repo.get_agent_mcp_tools(agent_id)
        except Exception as e:
            logger.error(f"Failed to get MCP tools for agent {agent_id}: {e}")
            return self.mcp_tools
        return await self._initialize_from_configs(agent_mcp_tools)

    async def _initialize_from_configs(self, configs) -> List[MCPTools]:
        """Build + connect each configured tool, keeping only the ones that
        come up with functions available."""
        try:
            # Initialize each MCP tool asynchronously
            for mcp_tool_config in configs:
                try:
                    logger.debug(f"Initializing MCP tool: {mcp_tool_config.name}")
                    mcp_tool = self._build_tool(mcp_tool_config)
                    await self._connect_and_register(mcp_tool, mcp_tool_config.name)
                except Exception as e:
                    logger.error(f"Failed to initialize MCP tool {mcp_tool_config.name}: {e}")
                    import traceback
                    logger.error(f"MCP tool error traceback: {traceback.format_exc()}")
                    self.failed_tools.append({"name": mcp_tool_config.name, "error": str(e)})
                    continue

        except Exception as e:
            logger.error(f"Failed to initialize MCP tools: {e}")

        logger.debug(f"Initialized {len(self.mcp_tools)} MCP tools")
        return self.mcp_tools

    @classmethod
    def _build_tool(cls, config) -> Optional[MCPTools]:
        """MCPTools for a config of any transport, or None (with a logged
        reason) when the config is unusable."""
        if config.transport_type == MCPTransportType.STDIO:
            return cls._build_stdio_tool(config)
        if config.transport_type in (MCPTransportType.SSE, MCPTransportType.HTTP):
            return cls._build_remote_tool(config)
        logger.warning(f"MCP tool {config.name} has unsupported transport {config.transport_type}, skipping")
        return None

    @staticmethod
    def _build_stdio_tool(config) -> Optional[MCPTools]:
        """MCPTools for a local subprocess server (npx/uvx/binary)."""
        if not (config.command and config.args):
            logger.warning(f"STDIO MCP tool {config.name} missing command or args")
            return None

        command_parts = [config.command] + config.args

        # The filesystem server takes its allowed directories as trailing
        # arguments; accept them from ALLOWED_DIRECTORIES too.
        if "@modelcontextprotocol/server-filesystem" in str(config.args):
            args_after_package = []
            package_found = False
            for arg in config.args:
                if package_found:
                    args_after_package.append(arg)
                elif arg == "@modelcontextprotocol/server-filesystem":
                    package_found = True

            if not args_after_package:
                allowed_dirs_env = (config.env_vars or {}).get("ALLOWED_DIRECTORIES")
                directories = [d.strip() for d in (allowed_dirs_env or "").split(",") if d.strip()]
                if not directories:
                    logger.warning(f"Filesystem MCP tool {config.name} missing directory arguments (args or ALLOWED_DIRECTORIES), skipping")
                    return None
                command_parts.extend(directories)
                logger.debug(f"Added directories from env_vars: {directories}")

        command_str = " ".join(command_parts)
        logger.debug(f"Creating STDIO MCP tool with command: {command_str}")

        # Prepare environment variables if provided (excluding ALLOWED_DIRECTORIES which we handled above)
        env_vars_for_process = None
        if config.env_vars:
            env_vars_for_process = {k: v for k, v in config.env_vars.items() if k != "ALLOWED_DIRECTORIES"}
            if env_vars_for_process:
                # Values may hold credentials (API keys, tokens) — log names only
                logger.debug(f"Environment variables configured: {list(env_vars_for_process.keys())}")

        return MCPTools(command_str, env=env_vars_for_process)

    async def test_tool_config(self, config) -> dict:
        """Connect to a configured tool once and report what happened — backs
        the Test button on the MCP config page. Goes through the same
        build/connect path as a real run, so the reported error is exactly
        what a run would record. Never raises."""
        failures_before = len(self.failed_tools)
        try:
            mcp_tool = self._build_tool(config)
            connected = await self._connect_and_register(mcp_tool, config.name)
        except Exception as e:
            return {"success": False, "functions": [], "error": str(e)}
        if connected:
            functions = list(getattr(mcp_tool, "functions", None) or {})
            await self.cleanup_mcp_tools()
            return {"success": True, "functions": functions, "error": None}
        new_failures = self.failed_tools[failures_before:]
        error = new_failures[-1]["error"] if new_failures else "Failed to connect to the server"
        return {"success": False, "functions": [], "error": error}

    @staticmethod
    def _build_remote_tool(config) -> Optional[MCPTools]:
        """MCPTools for a remote MCP server. HTTP uses the streamable-HTTP
        transport; SSE is kept for servers that only speak the older
        transport."""
        if not config.url:
            logger.warning(f"Remote MCP tool {config.name} missing URL, skipping")
            return None
        headers = config.headers or None
        timeout = config.timeout or 30
        sse_read_timeout = config.sse_read_timeout or 300
        if config.transport_type == MCPTransportType.SSE:
            server_params = SSEClientParams(
                url=config.url,
                headers=headers,
                timeout=timeout,
                sse_read_timeout=sse_read_timeout,
            )
            return MCPTools(url=config.url, transport="sse", server_params=server_params)
        server_params = StreamableHTTPClientParams(
            url=config.url,
            headers=headers,
            timeout=timedelta(seconds=timeout),
            sse_read_timeout=timedelta(seconds=sse_read_timeout),
            terminate_on_close=(
                config.terminate_on_close if config.terminate_on_close is not None else True
            ),
        )
        return MCPTools(url=config.url, transport="streamable-http", server_params=server_params)

    async def _connect_and_register(self, mcp_tool: Optional[MCPTools], name: str) -> bool:
        """Connect a built tool, verify it exposes functions, and register it
        for use + cleanup. Failed tools are torn down, never registered."""
        if mcp_tool is None:
            self.failed_tools.append({
                "name": name,
                "error": "Tool is misconfigured — check its command/args (STDIO) or URL (SSE/HTTP)",
            })
            return False
        try:
            await asyncio.wait_for(mcp_tool.__aenter__(), timeout=CONNECT_TIMEOUT_SECONDS)
            logger.debug(f"Entered MCP tool context: {name}")
        except asyncio.TimeoutError:
            logger.error(f"Timeout connecting to MCP tool {name}")
            self.failed_tools.append({
                "name": name,
                "error": f"Timed out after {CONNECT_TIMEOUT_SECONDS:.0f}s connecting to the server",
            })
            await self._abort_tool(mcp_tool)
            return False
        except Exception as e:
            logger.error(f"Failed to connect MCP tool {name}: {e}")
            # For package not found errors (like Git server), skip silently after first error
            if "404" in str(e) or "not found" in str(e).lower() or "no such package" in str(e).lower():
                logger.warning(f"MCP tool package not found, skipping: {name}")
            self.failed_tools.append({"name": name, "error": str(e)})
            await self._abort_tool(mcp_tool)
            return False

        # Verify functions are loaded after connection
        if getattr(mcp_tool, "functions", None):
            logger.debug(f"MCP tool {name} loaded functions: {list(mcp_tool.functions.keys())}")
            # Configured display name — lets consumers (e.g. the investigation
            # evidence log) attribute each tool call to its connector.
            mcp_tool._connector_name = name
            self.mcp_tools.append(mcp_tool)
            self.connected_tool_names.append(name)
            return True
        logger.warning(f"MCP tool {name} has no functions available after connection")
        self.failed_tools.append({"name": name, "error": "Connected, but the server exposed no tools"})
        await self._abort_tool(mcp_tool)
        return False

    @staticmethod
    async def _abort_tool(mcp_tool: MCPTools) -> None:
        """Best-effort teardown of a tool that failed to come up."""
        try:
            await asyncio.wait_for(mcp_tool.__aexit__(None, None, None), timeout=2.0)
        except Exception:
            pass

    async def cleanup_mcp_tools(self):
        """
        Clean up MCP tools by properly disconnecting them.
        """
        if not self.mcp_tools:
            logger.debug("No MCP tools to clean up")
            return
            
        for i, mcp_tool in enumerate(self.mcp_tools):
            try:
                logger.debug(f"Cleaning up MCP tool {i+1}/{len(self.mcp_tools)}")
                
                # Try multiple cleanup methods with timeout
                cleaned_up = False
                
                # Try __aexit__ first (most common for MCPTools)
                if hasattr(mcp_tool, '__aexit__'):
                    try:
                        await asyncio.wait_for(mcp_tool.__aexit__(None, None, None), timeout=5.0)
                        cleaned_up = True
                        logger.debug(f"Exited MCP tool {i+1} context")
                    except asyncio.TimeoutError:
                        logger.warning(f"Timeout exiting MCP tool {i+1} context")
                    except Exception as e:
                        # Handle known non-critical async context manager warnings
                        if "cancel scope" in str(e) or "different task" in str(e):
                            logger.debug(f"MCP tool {i+1} cleanup warning (non-critical): {e}")
                        else:
                            logger.warning(f"Error exiting MCP tool {i+1} context: {e}")
                
                if not cleaned_up and hasattr(mcp_tool, 'disconnect'):
                    try:
                        await asyncio.wait_for(mcp_tool.disconnect(), timeout=5.0)
                        cleaned_up = True
                        logger.debug(f"Disconnected MCP tool {i+1}")
                    except asyncio.TimeoutError:
                        logger.warning(f"Timeout disconnecting MCP tool {i+1}")
                    except Exception as e:
                        if "cancel scope" in str(e) or "different task" in str(e):
                            logger.debug(f"MCP tool {i+1} disconnect warning (non-critical): {e}")
                        else:
                            logger.warning(f"Error disconnecting MCP tool {i+1}: {e}")
                
                if not cleaned_up and hasattr(mcp_tool, 'stop'):
                    try:
                        await asyncio.wait_for(mcp_tool.stop(), timeout=5.0)
                        cleaned_up = True
                        logger.debug(f"Stopped MCP tool {i+1}")
                    except asyncio.TimeoutError:
                        logger.warning(f"Timeout stopping MCP tool {i+1}")
                    except Exception as e:
                        if "cancel scope" in str(e) or "different task" in str(e):
                            logger.debug(f"MCP tool {i+1} stop warning (non-critical): {e}")
                        else:
                            logger.warning(f"Error stopping MCP tool {i+1}: {e}")
                
                if not cleaned_up:
                    logger.warning(f"Could not properly cleanup MCP tool {i+1}")
                    
            except Exception as e:
                logger.error(f"Unexpected error cleaning up MCP tool {i+1}: {e}")
        
        # Clear the tools list after cleanup
        self.mcp_tools.clear()
        logger.debug("All MCP tools cleaned up")


# Convenience functions for backward compatibility and easy usage
async def initialize_mcp_tools(agent_id: str, org_id: str) -> List[MCPTools]:
    """
    Initialize MCP tools for an agent asynchronously.
    Returns a list of connected MCPTools instances.
    """
    manager = MCPToolsManager()
    return await manager.initialize_mcp_tools(agent_id, org_id)


async def cleanup_mcp_tools(mcp_tools: List[MCPTools]):
    """
    Clean up a list of MCP tools.
    """
    manager = MCPToolsManager()
    manager.mcp_tools = mcp_tools
    await manager.cleanup_mcp_tools()


class ChatAgentMCPMixin:
    """
    Mixin class to add MCP tools functionality to ChatAgent
    """
    
    @classmethod
    async def create_async(cls, api_key: str, model_name: str = "gpt-4o-mini", model_type: str = "OPENAI", 
                          org_id: str = None, agent_id: str = None, customer_id: str = None, 
                          session_id: str = None, custom_system_prompt: str = None,
                          transfer_to_human: bool | None = None, source: str = None,
                          channel: str = None, extra_context: str = None):
        """
        Async factory method to create a ChatAgent with MCP tools initialized.
        """
        # Initialize MCP tools asynchronously if agent_id and org_id are provided
        mcp_tools = []
        mcp_manager = None
        if agent_id and org_id:
            try:
                mcp_manager = MCPToolsManager()
                mcp_tools = await mcp_manager.initialize_mcp_tools(agent_id, org_id)
            except Exception as e:
                logger.error(f"Failed to initialize MCP tools: {e}")

        # Create ChatAgent instance with initialized MCP tools
        instance = cls(
            api_key=api_key,
            model_name=model_name,
            model_type=model_type,
            org_id=org_id,
            agent_id=agent_id,
            customer_id=customer_id,
            session_id=session_id,
            custom_system_prompt=custom_system_prompt,
            transfer_to_human=transfer_to_human,
            mcp_tools=mcp_tools,
            source=source,
            channel=channel,
            extra_context=extra_context
        )
        
        # Attach the MCP manager to the instance for cleanup
        instance._mcp_manager = mcp_manager
        
        return instance
    
    async def cleanup_mcp_tools(self):
        """
        Clean up MCP tools by properly disconnecting them.
        """
        if hasattr(self, '_mcp_manager') and self._mcp_manager:
            await self._mcp_manager.cleanup_mcp_tools()
        elif hasattr(self, 'mcp_tools') and self.mcp_tools:
            await cleanup_mcp_tools(self.mcp_tools)

    async def safe_cleanup_mcp_tools(self, timeout: float = 2.0):
        """
        Best-effort MCP cleanup after a chat turn: bounded by a timeout and
        never raises, so cleanup can't break or block the response flow.
        """
        try:
            await asyncio.wait_for(self.cleanup_mcp_tools(), timeout=timeout)
        except asyncio.TimeoutError:
            logger.debug("MCP cleanup timed out (non-critical)")
        except Exception as e:
            logger.debug(f"MCP cleanup warning (non-critical): {e}")
    
    def __del__(self):
        """
        Destructor to clean up MCP tools if they weren't properly cleaned up.
        Note: This is a fallback and shouldn't be relied upon for proper cleanup.
        """
        if hasattr(self, 'mcp_tools') and self.mcp_tools:
            logger.debug("MCP tools cleanup detected in destructor (likely due to async context cleanup timing)")
            # Can't run async code in __del__, so we just log for debugging 