#!/usr/bin/env python3
"""生成 Chrome 扩展所需的各种尺寸图标"""

import os
from PIL import Image

def generate_icons(input_path, output_dir):
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 打开原始图标
    try:
        img = Image.open(input_path)
        print(f"成功打开原始图标: {input_path}")
        print(f"原始尺寸: {img.size}")
    except Exception as e:
        print(f"打开图标失败: {e}")
        return
    
    # Chrome 扩展需要的图标尺寸
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        try:
            # 调整大小（保持比例）
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # 保存图标
            output_path = os.path.join(output_dir, f"icon{size}.png")
            resized.save(output_path, "PNG")
            print(f"生成图标: {output_path}")
        except Exception as e:
            print(f"生成 {size}x{size} 图标失败: {e}")

if __name__ == "__main__":
    # 输入路径
    input_logo = os.path.join(os.path.dirname(__file__), "../images/logo.png")
    output_dir = os.path.join(os.path.dirname(__file__), "../images")
    
    print("=" * 50)
    print("开始生成 Chrome 扩展图标...")
    print(f"输入文件: {input_logo}")
    print(f"输出目录: {output_dir}")
    print("=" * 50)
    
    generate_icons(input_logo, output_dir)
    
    print("=" * 50)
    print("图标生成完成！")
    print("=" * 50)
