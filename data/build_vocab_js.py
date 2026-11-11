# -*- coding: utf-8 -*-
# Prevede data/vocab.json na data/vocab.js (nacita se ve hre pres <script>, funguje i z lokalniho souboru).
import json, os
here = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(here, 'vocab.json'), encoding='utf-8'))
js = "// ENGLISH STARS - slovni zasoba (generovano z data/vocab.json, needitovat rucne; zmeny delej v vocab.json a spust data/build_vocab_js.py)\nwindow.ES_VOCAB = " + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ";\n"
open(os.path.join(here, 'vocab.js'), 'w', encoding='utf-8').write(js)
print('vocab.js OK:', sum(len(u['words']) for u in d['units']), 'slov,', sum(len(u['phrases']) for u in d['units']), 'frazi')
