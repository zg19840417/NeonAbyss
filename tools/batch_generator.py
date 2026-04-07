import http.client
import json
import os
import sys
import time

class ComfyUI:
    def __init__(self, host, port):
        self.host = host
        self.port = port
    
    def queue_prompt(self, workflow):
        post_data = json.dumps({'prompt': workflow})
        headers = {'Content-Type': 'application/json'}
        
        conn = http.client.HTTPConnection(self.host, self.port)
        conn.request('POST', '/prompt', post_data, headers)
        response = conn.getresponse()
        data = response.read().decode('utf-8')
        conn.close()
        return json.loads(data)
    
    def get_history(self, prompt_id):
        conn = http.client.HTTPConnection(self.host, self.port)
        conn.request('GET', f'/history/{prompt_id}')
        response = conn.getresponse()
        data = response.read().decode('utf-8')
        conn.close()
        return json.loads(data)
    
    def download_image(self, filename, subfolder, img_type, save_path):
        path = f"/view?filename={filename}&subfolder={subfolder}&type={img_type}"
        conn = http.client.HTTPConnection(self.host, self.port)
        conn.request('GET', path)
        response = conn.getresponse()
        
        with open(save_path, 'wb') as f:
            f.write(response.read())
        conn.close()

def build_workflow(prompt, seed=None, width=960, height=1600, steps=8):
    if seed is None:
        import random
        seed = random.randint(1, 999999999999999)
    
    return {
        "57:28": {
            "inputs": {
                "unet_name": "z_image\\ZIT-divingZImageTurbo_v50Fp16.safetensors",
                "weight_dtype": "default"
            },
            "class_type": "UNETLoader"
        },
        "57:11": {
            "inputs": {
                "shift": 3,
                "model": ["57:28", 0]
            },
            "class_type": "ModelSamplingAuraFlow"
        },
        "57:13": {
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            },
            "class_type": "EmptySD3LatentImage"
        },
        "57:30": {
            "inputs": {
                "clip_name": "qwen_3_4b.safetensors",
                "type": "lumina2",
                "device": "default"
            },
            "class_type": "CLIPLoader"
        },
        "57:29": {
            "inputs": {
                "vae_name": "ae.safetensors"
            },
            "class_type": "VAELoader"
        },
        "57:27": {
            "inputs": {
                "text": prompt,
                "clip": ["57:30", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "57:33": {
            "inputs": {
                "conditioning": ["57:27", 0]
            },
            "class_type": "ConditioningZeroOut"
        },
        "57:3": {
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": 1,
                "sampler_name": "res_multistep",
                "scheduler": "simple",
                "denoise": 1,
                "model": ["57:11", 0],
                "positive": ["57:27", 0],
                "negative": ["57:33", 0],
                "latent_image": ["57:13", 0]
            },
            "class_type": "KSampler"
        },
        "57:8": {
            "inputs": {
                "samples": ["57:3", 0],
                "vae": ["57:29", 0]
            },
            "class_type": "VAEDecode"
        },
        "9": {
            "inputs": {
                "filename_prefix": "fusion",
                "images": ["57:8", 0]
            },
            "class_type": "SaveImage"
        }
    }

def generate_portrait(comfyui, fm_id, name, prompt, output_dir, timeout=300):
    print(f"\n{'='*50}")
    print(f"生成 {fm_id}: {name}")
    print(f"{'='*50}")
    
    workflow = build_workflow(prompt)
    
    print("提交任务...")
    result = comfyui.queue_prompt(workflow)
    
    if 'prompt_id' not in result:
        print(f"错误: 提交失败 {result}")
        return False
    
    prompt_id = result['prompt_id']
    print(f"Prompt ID: {prompt_id}")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        history = comfyui.get_history(prompt_id)
        
        if prompt_id in history:
            node_data = history[prompt_id]
            status = node_data.get('status', {})
            
            if status.get('completed') or status.get('executed'):
                print("生成完成!")
                
                outputs = node_data.get('outputs', {})
                for node_id, output_data in outputs.items():
                    if 'images' in output_data:
                        for img in output_data['images']:
                            save_path = os.path.join(output_dir, f'{fm_id}.png')
                            comfyui.download_image(
                                img['filename'],
                                img.get('subfolder', ''),
                                img.get('type', 'output'),
                                save_path
                            )
                            print(f"已保存: {save_path}")
                            return True
        
        elapsed = int(time.time() - start_time)
        print(f"等待中... {elapsed}s")
        time.sleep(3)
    
    print("超时!")
    return False

def main():
    config = json.load(open(r'd:\77-myProject\苏打地牢\tools\comfyui-config.json', 'r'))
    comfyui = ComfyUI(config['comfyui']['host'], config['comfyui']['port'])
    
    output_dir = r'd:\77-myProject\苏打地牢\assets\images\characters\fusion'
    os.makedirs(output_dir, exist_ok=True)
    
    with open(r'd:\77-myProject\苏打地牢\tools\to_generate.json', 'r', encoding='utf-8') as f:
        to_generate = json.load(f)
    
    print(f"待生成角色数量: {len(to_generate)}")
    
    success = 0
    failed = 0
    
    for i, item in enumerate(to_generate, 1):
        print(f"\n[{i}/{len(to_generate)}]", end=" ")
        
        result = generate_portrait(
            comfyui,
            item['fm'],
            item['name'],
            item['prompt'],
            output_dir
        )
        
        if result:
            success += 1
        else:
            failed += 1
        
        if i < len(to_generate):
            print("等待2秒...")
            time.sleep(2)
    
    print(f"\n{'='*50}")
    print(f"完成! 成功: {success}, 失败: {failed}")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
