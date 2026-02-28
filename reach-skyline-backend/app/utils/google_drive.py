import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import json

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.readonly']

def get_drive_service():
    creds = None
    token_path = 'token.json'
    
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            client_config = {
                "web": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "project_id": "reach-skyline",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "redirect_uris": ["http://localhost:5000/api/media/oauth-callback"]
                }
            }
            # Note: For a real server, we use a web-based flow. 
            # For this dashboard, we'll implement a route to trigger this.
            return None, client_config

    return build('drive', 'v3', credentials=creds), None

def sync_folder(service, folder_id):
    """Lists files in the given folder and returns metadata."""
    query = f"'{folder_id}' in parents and trashed = false and (mimeType contains 'video/' or mimeType contains 'image/')"
    results = service.files().list(
        q=query,
        pageSize=100, 
        fields="nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, createdTime, size, videoMediaMetadata)"
    ).execute()
    return results.get('files', [])
