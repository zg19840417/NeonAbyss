import http.client
import json

config = json.load(open(r'd:\77-myProject\苏打地牢\tools\comfyui-config.json', 'r'))

host = config['comfyui']['host']
port = config['comfyui']['port']

prompt_id = 'a7c5dabb-9022-4ef0-ba3c-b0918fcc7a95'

conn = http.client.HTTPConnection(host, port)
conn.request('GET', f'/history/{prompt_id}')
response = conn.getresponse()
data = response.read().decode('utf-8')
conn.close()

history = json.loads(data)
print(json.dumps(history, indent=2))
