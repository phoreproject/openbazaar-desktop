"""
Tool automatically synchronize *.json files in this directory with en_US.json.
Speed up development of translation files.

Features:
    1. remove not existing keys in *.json files
    2. copy en_US translation to *.json files
    3. print changes into console
"""

import json
import os
import pprint

BaseFile = "en_US.json"
CNT = 1


def main():
    with open(BaseFile) as f:
        base_content = json.load(f)

    for edit_file in os.listdir(os.curdir):
        if edit_file == BaseFile:
            continue

        if not edit_file.endswith(".json"):
            continue

        with open(edit_file) as f:
            edit_content = json.load(f)

        global CNT
        CNT = 1

        compare_tree(base_content, edit_content, edit_file)

        with open(edit_file, 'w') as f:
            f.write(json.dumps(edit_content, ensure_ascii=False, indent=2))


def compare_tree(base_file, edit_file, edit_file_name):
    global CNT

    keys_to_delete = []
    for key in edit_file.keys():
        # delete if key not exists in base file
        if key not in base_file:
            keys_to_delete.append(key)

        elif type(edit_file[key]) is dict:
            compare_tree(base_file[key], edit_file[key], edit_file_name)

    for key in keys_to_delete:
        print("{0} {1}. DELETING".format(edit_file_name, CNT))
        CNT += 1
        pprint.pprint(edit_file[key])
        print('\n\n')
        del edit_file[key]

    for key in base_file.keys():
        # add key if not exists in compare file
        if key not in edit_file:
            print("{0} {1}. ADDING".format(edit_file_name, CNT))
            CNT += 1
            pprint.pprint(base_file[key])
            print('\n\n')
            edit_file[key] = base_file[key]


if __name__ == '__main__':
    main()
