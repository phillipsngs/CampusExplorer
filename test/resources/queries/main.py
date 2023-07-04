# This is a sample Python script.

# Press ⌃R to execute it or replace it with your code.
# Press Double ⇧ to search everywhere for classes, files, tool windows, actions, and settings.

import json
import os



def read_files(path: str):
    with open(path, 'r+') as f:
        data = json.load(f);
        data["expected"] = data["with"]
        f.seek(0)
        del data["with"]
        json.dump(data, f, indent=4)
        f.truncate()

# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    arr = os.listdir()
    print(arr)
    try:
        for file_name in arr:
            read_files(file_name)
    except Exception:
        print("something funky just happened")
