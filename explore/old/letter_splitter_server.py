#!/usr/bin/env python3
"""
Simple HTTP server with file write capability for letter splitting tool
"""
import http.server
import socketserver
import json
import os
from urllib.parse import parse_qs
import sys
from datetime import datetime

PORT = 8002

class LetterSplitterHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/save_letter.py':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))
                filename = data.get('filename')
                letter_data = data.get('data')

                if not filename or not letter_data:
                    self.send_error(400, "Missing filename or data")
                    return

                # Save to letters/ directory
                filepath = os.path.join('letters', filename)

                # Backup original file with modification timestamp
                backup_filename = None
                if os.path.exists(filepath):
                    # Get modification time of existing file
                    mod_time = os.path.getmtime(filepath)
                    mod_datetime = datetime.fromtimestamp(mod_time)
                    timestamp_str = mod_datetime.strftime('%Y%m%d_%H%M%S')

                    # Create backup filename with timestamp
                    base_name = os.path.splitext(filename)[0]
                    ext = os.path.splitext(filename)[1]
                    backup_filename = f"{base_name}.{timestamp_str}{ext}"
                    backup_path = os.path.join('letters', backup_filename)

                    # Save backup
                    with open(filepath, 'r', encoding='utf-8') as f:
                        original = f.read()
                    with open(backup_path, 'w', encoding='utf-8') as f:
                        f.write(original)

                # Write new version
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(letter_data, f, ensure_ascii=False, indent=2)

                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                response = json.dumps({
                    'success': True,
                    'filename': filename,
                    'backup': backup_filename
                })
                self.wfile.write(response.encode())

                print(f"✓ Saved: {filename}")
                if backup_filename:
                    print(f"  Backup: {backup_filename}")

            except Exception as e:
                self.send_error(500, f"Error saving file: {str(e)}")
                print(f"✗ Error: {str(e)}")
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        # Add CORS headers to all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    Handler = LetterSplitterHandler

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"╔══════════════════════════════════════════════════════╗")
        print(f"║  Letter Splitter Server Running                      ║")
        print(f"╠══════════════════════════════════════════════════════╣")
        print(f"║  📝 Editor:  http://localhost:{PORT}/                       ║")
        print(f"║  📂 Letters: {os.path.abspath('letters')}  ")
        print(f"║  💾 Backups: Timestamped (YYYYMMDD_HHMMSS)           ║")
        print(f"╚══════════════════════════════════════════════════════╝")
        print(f"\nPress Ctrl+C to stop the server\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✓ Server stopped")
            sys.exit(0)
