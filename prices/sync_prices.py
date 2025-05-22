#!/usr/bin/env python3
import json
import requests
import os
from datetime import datetime

def sync_prices():
    # 源数据URL
    source_url = "https://raw.githubusercontent.com/MartialBE/one-api/prices/prices.json"
    
    try:
        # 获取源数据
        response = requests.get(source_url)
        response.raise_for_status()
        prices_data = response.json()
        
        # 添加更新时间
        # prices_data = {
        #     "last_updated": datetime.now().isoformat(),
        #     "prices": prices_data
        # }
        
        # 确保目标目录存在
        os.makedirs("prices", exist_ok=True)
        
        # 写入本地文件
        with open("prices/prices.json", "w", encoding="utf-8") as f:
            json.dump(prices_data, f, ensure_ascii=False, indent=2)
            
        print("价格数据同步成功！")
        return True
        
    except Exception as e:
        print(f"同步失败: {str(e)}")
        return False

if __name__ == "__main__":
    sync_prices() 