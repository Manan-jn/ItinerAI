tool_config = BigQueryToolConfig(write_mode=WriteMode.BLOCKED)

# Try to get credentials from environment variable first, then fall back to auth.json file
key_contents_str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if key_contents_str:
    key_contents = json.loads(key_contents_str)
else:
    # Fall back to reading from auth.json file
    auth_file_path = os.path.join(os.path.dirname(__file__), "../../../auth.json")
    with open(auth_file_path, 'r') as f:
        key_contents = json.load(f)