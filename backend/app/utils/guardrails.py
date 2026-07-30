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

import re
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
from enum import Enum
from app.core.logger import get_logger

logger = get_logger(__name__)


class GuardrailType(str, Enum):
    """Types of guardrails that can be applied"""
    PII = "pii"
    JAILBREAK = "jailbreak"


class GuardrailAction(str, Enum):
    """Actions to take when guardrail is triggered"""
    BLOCK = "block"
    REDACT = "redact"
    WARNING = "warning"
    LOG = "log"


class GuardrailResult:
    """Result of guardrail evaluation"""
    
    def __init__(
        self,
        passed: bool,
        guardrail_type: GuardrailType,
        violations: List[str] = None,
        redacted_text: Optional[str] = None,
        confidence: float = 0.0
    ):
        self.passed = passed
        self.guardrail_type = guardrail_type
        self.violations = violations or []
        self.redacted_text = redacted_text
        self.confidence = confidence
    
    def to_dict(self) -> Dict:
        """Convert result to dictionary"""
        return {
            "passed": self.passed,
            "guardrail_type": self.guardrail_type.value,
            "violations": self.violations,
            "redacted_text": self.redacted_text,
            "confidence": self.confidence
        }


class PIIDetector:
    """
    Detector for Personally Identifiable Information (PII)
    Detects common PII patterns like emails, phone numbers, SSNs, credit cards, etc.
    """
    
    # Regex patterns for common PII types
    PATTERNS = {
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "phone": r'\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b',
        "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
        "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
        "ip_address": r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
        "date_of_birth": r'\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12][0-9]|3[01])[/-](?:19|20)\d{2}\b',
        # Add more patterns as needed
    }
    
    @staticmethod
    def detect(text: str, action: GuardrailAction = GuardrailAction.BLOCK) -> GuardrailResult:
        """
        Detect PII in text
        
        Args:
            text: Text to scan for PII
            action: Action to take (BLOCK, REDACT, WARNING, LOG)
            
        Returns:
            GuardrailResult with detection results
        """
        violations = []
        redacted_text = text
        
        for pii_type, pattern in PIIDetector.PATTERNS.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                violations.append(f"{pii_type} at position {match.start()} (length {len(match.group())})")
                
                # Redact if action is REDACT
                if action == GuardrailAction.REDACT:
                    redacted_text = redacted_text.replace(
                        match.group(),
                        f"[{pii_type.upper()}_REDACTED]"
                    )
        
        passed = len(violations) == 0
        
        # Calculate confidence based on pattern matching (simple heuristic)
        confidence = 1.0 if violations else 0.0
        
        logger.info(f"PII Detection - Passed: {passed}, Violations: {len(violations)}")
        
        return GuardrailResult(
            passed=passed,
            guardrail_type=GuardrailType.PII,
            violations=violations,
            redacted_text=redacted_text if action == GuardrailAction.REDACT else None,
            confidence=confidence
        )


# --- Injection pattern sets -------------------------------------------------
#
# Two tiers. A strong (Tier A) pattern is high-precision evidence of a prompt
# injection and scores 1.0 on its own; weak (Tier B) signals are phrasings that
# only matter in combination and score 0.25 each. When the message contains
# technical content (code, logs, shell commands) the weak subtotal is halved —
# support chats are full of pasted snippets that echo these phrasings.
#
# Deliberately NOT detected — each is normal in a support conversation, and
# removing them is a contract backed one-for-one by tests
# (tests/utils/test_guardrails_jailbreak.py):
#   "sudo"                         self-hosting / CLI help
#   "debug mode", "developer mode" real product features (bare mention)
#   "theoretically"                ordinary hedging
#   bare "DAN"                     the first name Dan (the old pattern matched
#                                  it because text was lowercased first)
#   "ignore/disregard my previous message|ticket|email"
#                                  an override needs an instruction NOUN
#   bare "what are your instructions"
#                                  "...for returning an item?" is a product
#                                  question; disclosure is the prompt policy's job

# Literal chat-template tokens. A human visitor never types these; they only
# appear when someone is smuggling a fake system/assistant turn.
_TEMPLATE_MARKER_PATTERNS = [
    re.compile(r'<\|im_(?:start|end)\|>'),
    re.compile(r'<\|eot_id\|>'),
    re.compile(r'<\|(?:system|user|assistant|endoftext)\|>'),
    re.compile(r'\[/?INST\]'),
    re.compile(r'<<SYS>>'),
    re.compile(r'\bBEGIN SYSTEM PROMPT\b', re.IGNORECASE),
    re.compile(r'(?m)^\s*\[SYSTEM\]\s*:?\s*$', re.IGNORECASE),
]

# "ignore the previous..." only counts with an instruction noun in range:
# "ignore my previous message" is normal traffic, "ignore your previous
# instructions" is not.
_OVERRIDE_PATTERNS = [
    re.compile(
        r'\b(?:ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}?'
        r'\b(?:previous|prior|above|earlier|initial|original|system|all)\b[^.\n]{0,20}?'
        r'\b(?:instructions?|rules?|prompts?|directives?|guidelines?)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\byour\s+(?:new|real|actual|true|updated)\s+'
        r'(?:instructions?|rules?|system\s+prompt)\s+(?:are|is)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\bthis\s+(?:overrides|supersedes|replaces|cancels)\s+'
        r'(?:all|any|everything|your|the)\b',
        re.IGNORECASE,
    ),
]

_EXFIL_PATTERNS = [
    re.compile(
        r'\b(?:reveal|repeat|print|output|show|display|dump|recite|reproduce)\b'
        r'[^.\n]{0,40}?'
        r'\b(?:system\s+(?:prompt|message)|initial\s+(?:prompt|instructions)'
        r'|original\s+instructions|instructions\s+verbatim|prompt\s+verbatim'
        r'|everything\s+above)\b',
        re.IGNORECASE,
    ),
]

_PERSONA_PATTERNS = [
    re.compile(
        r'\byou\s+are\s+now\s+(?:an?\s+)?'
        r'(?:dan\b|unrestricted|unfiltered|jailbroken|uncensored'
        r'|different\s+(?:assistant|ai|bot|model|persona))',
        re.IGNORECASE,
    ),
    re.compile(r'\bdo\s+anything\s+now\b', re.IGNORECASE),
    # Case-sensitive on purpose: "DAN mode" is a jailbreak, "dan mode..." in
    # lowercase prose is far more likely to be about a person called Dan.
    re.compile(r'\bDAN\s+(?:mode|prompt|jailbreak)\b'),
    re.compile(
        r'\b(?:developer|dev|god|admin(?:istrator)?|unrestricted|jailbreak)\s+'
        r'mode\s+(?:on|enabled|activated|engaged)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\bpretend\s+(?:you\s+are|to\s+be)\s+(?:an?\s+)?'
        r'(?:unrestricted|uncensored|jailbroken|evil)',
        re.IGNORECASE,
    ),
]

# Strong patterns grouped under the stable rule ids used by guardrail events.
_STRONG_PATTERNS = {
    "injection.frame_tokens": _TEMPLATE_MARKER_PATTERNS,
    "injection.override_instructions": _OVERRIDE_PATTERNS,
    "injection.prompt_exfil": _EXFIL_PATTERNS,
    "injection.role_hijack": _PERSONA_PATTERNS,
}

_WEAK_SIGNAL_PATTERNS = [
    re.compile(r'\bact\s+(?:as|like)\s+an?\b', re.IGNORECASE),
    re.compile(r'\bfrom\s+now\s+on\b', re.IGNORECASE),
    re.compile(r'\brole[- ]?play\b', re.IGNORECASE),
    re.compile(r'\bpretend\s+(?:you\s+are|to\s+be)\b', re.IGNORECASE),
    re.compile(r'\bhypothetically\b', re.IGNORECASE),
    re.compile(r'\bfor\s+educational\s+purposes\b', re.IGNORECASE),
    re.compile(
        r'\bin\s+an?\s+(?:fictional|hypothetical|alternate)\s+'
        r'(?:scenario|world|universe)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\bno\s+(?:restrictions?|limitations?|rules|boundaries|filters?)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\bwithout\s+(?:any\s+)?(?:restrictions?|limits?|limitations?|filters?)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\byou\s+(?:must|should|have\s+to)\s+(?:obey|follow|comply)\b',
        re.IGNORECASE,
    ),
    re.compile(r'\bunrestricted\s+mode\b', re.IGNORECASE),
    re.compile(
        r'\bwhat\s+(?:is|are)\s+your\s+(?:instructions|rules|system\s+prompt)\b',
        re.IGNORECASE,
    ),
    re.compile(r'\btotally\s+different\s+persona\b', re.IGNORECASE),
]

# Markers of pasted technical content (code, logs, shell). Their presence
# halves the weak-signal score — see the suppressor note above.
_TECHNICAL_CONTEXT_PATTERNS = [
    re.compile(r'```'),
    re.compile(r'Traceback \(most recent call last\)'),
    re.compile(r'File "[^"]+", line \d+'),
    re.compile(r'(?m)^\s*(?:\$ |sudo |npm |pip |docker |curl |git )'),
    re.compile(r'\{"'),
    re.compile(r'\b(?:GET|POST|PUT|PATCH|DELETE)\s+/\S+'),
    re.compile(r'\bat\s+\w+\('),
    re.compile(r'\S+\.(?:log|ya?ml|env|conf)\b'),
]

_WEAK_SIGNAL_WEIGHT = 0.25
_TECHNICAL_SUPPRESSION = 0.5


@dataclass(frozen=True)
class InjectionResult:
    """Strong-signal (Tier A) injection evidence for the global guardrail layer."""

    rule_ids: Tuple[str, ...]
    matched: Tuple[str, ...]  # short matched tokens only — safe for plain-JSON storage

    @property
    def triggered(self) -> bool:
        return bool(self.rule_ids)

    @property
    def has_template_marker(self) -> bool:
        return "injection.frame_tokens" in self.rule_ids


def detect_injection(text: str) -> InjectionResult:
    """Scan text for strong injection signals only (no weak/contextual scoring).

    This is the pre-LLM entry point used by the global chat guardrail: weak
    signals are advisory and never block outside an explicitly configured
    workflow guardrails node, so they are not reported here.
    """
    rule_ids: List[str] = []
    matched: List[str] = []
    for rule_id, patterns in _STRONG_PATTERNS.items():
        for pattern in patterns:
            match = pattern.search(text or "")
            if match:
                if rule_id not in rule_ids:
                    rule_ids.append(rule_id)
                matched.append(match.group()[:60])
                break  # one hit per rule id is enough
    return InjectionResult(rule_ids=tuple(rule_ids), matched=tuple(matched))


class JailbreakDetector:
    """
    Detector for jailbreak / prompt-injection attempts.

    Scoring counts DISTINCT patterns (repeating one phrase scores once):
    every strong hit scores 1.0, weak signals 0.25 each — halved when the
    message contains technical content. `passed = score < sensitivity`, so at
    the default 0.7 a single strong hit or three clean weak signals fail.
    """

    @staticmethod
    def detect(text: str, sensitivity: float = 0.7) -> GuardrailResult:
        """
        Detect jailbreak attempts in text

        Args:
            text: Text to scan for jailbreak attempts
            sensitivity: Detection sensitivity (0.0 to 1.0, default 0.7)

        Returns:
            GuardrailResult with detection results
        """
        violations = []

        strong = detect_injection(text)
        for rule_id, token in zip(strong.rule_ids, strong.matched):
            violations.append(f"Jailbreak pattern [{rule_id}]: '{token}'")

        weak_hits = 0
        for pattern in _WEAK_SIGNAL_PATTERNS:
            match = pattern.search(text or "")
            if match:
                weak_hits += 1
                violations.append(f"Suspicious phrase: '{match.group()[:60]}'")

        suppression = 1.0
        if weak_hits and any(p.search(text or "") for p in _TECHNICAL_CONTEXT_PATTERNS):
            suppression = _TECHNICAL_SUPPRESSION

        confidence = min(
            1.0,
            len(strong.rule_ids) + weak_hits * _WEAK_SIGNAL_WEIGHT * suppression,
        )
        passed = confidence < sensitivity

        logger.info(
            f"Jailbreak Detection - Passed: {passed}, "
            f"Confidence: {confidence:.2f}, "
            f"Strong Rules: {list(strong.rule_ids)}, "
            f"Weak Signals: {weak_hits}"
        )

        return GuardrailResult(
            passed=passed,
            guardrail_type=GuardrailType.JAILBREAK,
            violations=violations,
            redacted_text=None,
            confidence=confidence
        )


class GuardrailsEngine:
    """
    Main guardrails engine that orchestrates multiple guardrail checks
    """
    
    def __init__(self):
        self.pii_detector = PIIDetector()
        self.jailbreak_detector = JailbreakDetector()
    
    def evaluate(
        self,
        text: str,
        enabled_guardrails: List[GuardrailType],
        actions: Dict[GuardrailType, GuardrailAction] = None,
        jailbreak_sensitivity: float = 0.7
    ) -> Tuple[bool, List[GuardrailResult]]:
        """
        Evaluate text against enabled guardrails
        
        Args:
            text: Text to evaluate
            enabled_guardrails: List of guardrail types to check
            actions: Dictionary mapping guardrail types to actions
            jailbreak_sensitivity: Sensitivity for jailbreak detection (0.0-1.0)
            
        Returns:
            Tuple of (all_passed, list_of_results)
        """
        if actions is None:
            actions = {}
        
        results = []
        all_passed = True
        
        for guardrail_type in enabled_guardrails:
            action = actions.get(guardrail_type, GuardrailAction.BLOCK)
            
            if guardrail_type == GuardrailType.PII:
                result = self.pii_detector.detect(text, action)
                results.append(result)
                if not result.passed:
                    all_passed = False
            
            elif guardrail_type == GuardrailType.JAILBREAK:
                result = self.jailbreak_detector.detect(text, jailbreak_sensitivity)
                results.append(result)
                if not result.passed:
                    all_passed = False
        
        return all_passed, results
    
    def get_default_block_message(self, results: List[GuardrailResult]) -> str:
        """
        Generate a user-friendly message when content is blocked
        
        Args:
            results: List of guardrail results
            
        Returns:
            Message to display to user
        """
        failed_guardrails = [r for r in results if not r.passed]
        
        if not failed_guardrails:
            return "Your message has been processed successfully."
        
        
        if GuardrailType.PII in [r.guardrail_type for r in failed_guardrails]:
            return (
                "I noticed your message contains sensitive personal information. "
                "For your privacy and security, please avoid sharing personal details "
                "like email addresses, phone numbers, or other identifying information."
            )
        
        if GuardrailType.JAILBREAK in [r.guardrail_type for r in failed_guardrails]:
            return (
                "I'm designed to help you with legitimate questions and tasks. "
                "I can't process requests that ask me to ignore my guidelines or "
                "behave in ways I'm not designed for. How else can I assist you?"
            )
        
        return (
            "I'm unable to process your message as it doesn't meet our "
            "content guidelines. Please rephrase your request."
        )


# Convenience function for quick guardrail checks
def check_guardrails(
    text: str,
    guardrail_types: List[str],
    pii_action: str = "block",
    jailbreak_sensitivity: float = 0.7
) -> Tuple[bool, List[Dict], str]:
    """
    Convenience function to check text against guardrails
    
    Args:
        text: Text to check
        guardrail_types: List of guardrail type strings ("pii", "jailbreak")
        pii_action: Action for PII ("block", "redact", "warning", "log")
        jailbreak_sensitivity: Sensitivity for jailbreak detection
        
    Returns:
        Tuple of (passed, results_list, block_message)
    """
    engine = GuardrailsEngine()
    
    # Convert string types to enums
    enabled_guardrails = []
    actions = {}
    
    for gt in guardrail_types:
        try:
            guardrail_type = GuardrailType(gt.lower())
            enabled_guardrails.append(guardrail_type)
            
            if guardrail_type == GuardrailType.PII:
                actions[guardrail_type] = GuardrailAction(pii_action.lower())
        except ValueError:
            logger.warning(f"Unknown guardrail type: {gt}")
    
    passed, results = engine.evaluate(
        text,
        enabled_guardrails,
        actions,
        jailbreak_sensitivity
    )
    
    block_message = engine.get_default_block_message(results)
    results_dict = [r.to_dict() for r in results]
    
    return passed, results_dict, block_message
