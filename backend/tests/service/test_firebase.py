"""
Copyright 2024-2026 Komi AI

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

import pytest
from firebase_admin import credentials
from unittest.mock import patch, MagicMock, call, create_autospec
from app.services.firebase import initialize_firebase
import os

@pytest.fixture(autouse=True)
def mock_logger():
    """Mock logger for all tests"""
    with patch('app.services.firebase.logger') as mock_log:
        yield mock_log

@pytest.fixture
def mock_credential():
    """Create a mock Firebase credential"""
    mock_cred = MagicMock(spec=credentials.Base)
    return mock_cred

def test_initialize_firebase_success(mock_logger, mock_credential):
    """Test successful Firebase initialization"""
    with patch('app.services.firebase.credentials.Certificate', return_value=mock_credential) as mock_cert, \
         patch('app.services.firebase.initialize_app') as mock_init, \
         patch('firebase_admin._apps', new={}), \
         patch('app.services.firebase.get_app', side_effect=[ValueError(), None]), \
         patch('os.path.isfile', return_value=True), \
         patch('app.core.config.settings.FIREBASE_CREDENTIALS', 'path/to/creds.json'):
        
        # Execute
        initialize_firebase()
        
        # Assert
        mock_cert.assert_called_once()
        mock_init.assert_called_once_with(mock_credential)
        mock_logger.info.assert_has_calls([
            call("Initializing Firebase..."),
            call("Loading Firebase credentials from file path/to/creds.json"),
            call("Firebase initialized successfully")
        ])

def test_initialize_firebase_development_mode(mock_logger, mock_credential):
    """Test Firebase initialization in development mode when credentials file is missing"""
    with patch('app.services.firebase.credentials.Certificate', return_value=mock_credential) as mock_cert, \
         patch('app.services.firebase.initialize_app') as mock_init, \
         patch('firebase_admin._apps', new={}), \
         patch('app.services.firebase.get_app', side_effect=[ValueError(), None]), \
         patch('os.path.isfile', return_value=False), \
         patch('app.core.config.settings.FIREBASE_CREDENTIALS', 'nonexistent/path.json'):
        
        # Execute
        initialize_firebase()
        
        # Assert
        mock_cert.assert_called_once()
        cert_args = mock_cert.call_args[0][0]
        assert cert_args['project_id'] == 'demo-project'
        assert cert_args['type'] == 'service_account'
        mock_init.assert_called_once_with(mock_credential)
        mock_logger.warning.assert_called_once_with(
            "Firebase credentials not found at nonexistent/path.json. Running in development mode."
        )

def test_initialize_firebase_already_initialized(mock_logger):
    """Test Firebase initialization when already initialized"""
    with patch('firebase_admin._apps', new={'[DEFAULT]': MagicMock()}), \
         patch('app.services.firebase.get_app', return_value=MagicMock()):
        # Execute
        initialize_firebase()
        # Assert
        mock_logger.info.assert_called_once_with("Firebase already initialized")

def test_initialize_firebase_failure(mock_logger):
    """Test Firebase initialization failure"""
    with patch('app.services.firebase.credentials.Certificate') as mock_cert, \
         patch('firebase_admin._apps', new={}), \
         patch('app.services.firebase.get_app', side_effect=ValueError()):
        
        # Configure mock to raise exception
        error_msg = "Failed to initialize"
        mock_cert.side_effect = Exception(error_msg)
        
        # Execute - function should handle exception gracefully, not raise it
        initialize_firebase()
        
        # Assert that error was logged but function continued without raising
        mock_logger.error.assert_called_with(f"Error initializing Firebase: {error_msg}")
        mock_logger.warning.assert_called_with("Continuing without Firebase initialization")
