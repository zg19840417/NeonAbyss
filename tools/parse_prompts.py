import re, os, json

prompt_files = {
    'plant': r'd:\77-myProject\苏打地牢\docs\提示词\融合姬文生图提示词_植物系.md',
    'animal': r'd:\77-myProject\苏打地牢\docs\提示词\融合姬文生图提示词_动物系.md',
    'mech': r'd:\77-myProject\苏打地牢\docs\提示词\融合姬文生图提示词_机械系.md',
    'energy': r'd:\77-myProject\苏打地牢\docs\提示词\融合姬文生图提示词_能量系.md',
    'hybrid': r'd:\77-myProject\苏打地牢\docs\提示词\融合姬文生图提示词_混合系.md',
}

prompts = {}
for race, filepath in prompt_files.items():
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = r'### (FM\d+)：(.*?)[\n\r]+.*?文生图提示词.*?[\n\r]+(.*?)(?=\n---|\n### FM|$)'
    matches = re.findall(pattern, content, re.DOTALL)
    
    for fm_id, name, prompt in matches:
        prompts[fm_id] = {
            'name': name.strip(),
            'prompt': prompt.strip(),
            'race': race
        }

print(f'解析到 {len(prompts)} 个角色的提示词')

# 加载minionCards.json获取需要生成的角色列表
with open(r'd:\77-myProject\苏打地牢\assets\data\json\minionCards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

# 检查哪些需要生成
existing_files = set([f.replace('.png','') for f in os.listdir(r'd:\77-myProject\苏打地牢\assets\images\characters\fusion') if f.endswith('.png')])

to_generate = []
for card in cards:
    portrait = card.get('portrait', '')
    if portrait:
        file_id = portrait.split('/')[-1].replace('.png','')
        if file_id not in existing_files:
            if file_id in prompts:
                to_generate.append({
                    'fm': file_id,
                    'name': prompts[file_id]['name'],
                    'prompt': prompts[file_id]['prompt'],
                    'race': prompts[file_id]['race']
                })
            else:
                print(f"警告: {file_id} ({card['name']}) 没有找到提示词")

print(f'需要生成: {len(to_generate)} 个')
for item in to_generate[:10]:
    print(f"  {item['fm']}: {item['name']}")
print(f"  ... 还有 {len(to_generate) - 10} 个")

# 保存所有提示词
output_path = r'd:\77-myProject\苏打地牢\tools\character_prompts.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(prompts, f, ensure_ascii=False, indent=2)
print(f'\n已保存提示词到 {output_path}')

# 保存待生成列表
output_path2 = r'd:\77-myProject\苏打地牢\tools\to_generate.json'
with open(output_path2, 'w', encoding='utf-8') as f:
    json.dump(to_generate, f, ensure_ascii=False, indent=2)
print(f'已保存待生成列表到 {output_path2}')
