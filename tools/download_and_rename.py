import http.client
import json
import os

config = json.load(open(r'd:\77-myProject\苏打地牢\tools\comfyui-config.json', 'r'))
host = config['comfyui']['host']
port = config['comfyui']['port']

prompt_id = 'a7c5dabb-9022-4ef0-ba3c-b0918fcc7a95'

conn = http.client.HTTPConnection(host, port)
conn.request('GET', f'/history/{prompt_id}')
response = conn.getresponse()
data = response.read().decode('utf-8')
history = json.loads(data)

output_dir = r'd:\77-myProject\苏打地牢\assets\images\characters\fusion'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

if prompt_id in history:
    outputs = history[prompt_id].get('outputs', {})
    for node_id, node_data in outputs.items():
        if 'images' in node_data:
            for img in node_data['images']:
                filename = img['filename']
                subfolder = img.get('subfolder', '')
                
                # 下载图片
                path = f"/view?filename={filename}&subfolder={subfolder}&type=output"
                print(f"下载: {path}")
                
                conn = http.client.HTTPConnection(host, port)
                conn.request('GET', path)
                response = conn.getresponse()
                
                save_path = os.path.join(output_dir, 'FM017.png')
                with open(save_path, 'wb') as f:
                    f.write(response.read())
                print(f"已保存到: {save_path}")
                conn.close()
