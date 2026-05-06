import re
import os

base_dir = r'c:\vrmx_khadmoney\TO\web\src'

def load(f):
    with open(f, 'r', encoding='utf-8') as file: return file.read()
def save(f, c):
    with open(f, 'w', encoding='utf-8') as file: file.write(c)

def process_component(filename, prefix):
    content = load(filename)
    
    # 1. Extract the i18n object string roughly using a regex that captures between 'const i18n = {' and '}[language]'
    match = re.search(r'const i18n = \{([^}]*?en: \{.*?fr: \{.*?ar: \{.*?)\}\[language\]', content, re.DOTALL)
    if not match:
        print(f'Could not find i18n block in {filename}')
        return content, None
    
    i18n_block = match.group(1)
    
    # Extract en, fr, ar blocks
    en_match = re.search(r'en: \{(.*?)\},\s*fr:', i18n_block, re.DOTALL)
    fr_match = re.search(r'fr: \{(.*?)\},\s*ar:', i18n_block, re.DOTALL)
    ar_match = re.search(r'ar: \{(.*?)\},?\s*$', i18n_block, re.DOTALL)
    
    if not (en_match and fr_match and ar_match):
        print(f'Could not extract languages from {filename}')
        return content, None
        
    translations = {
        'en': en_match.group(1).strip(),
        'fr': fr_match.group(1).strip(),
        'ar': ar_match.group(1).strip(),
    }
    
    # Remove the const i18n block and const { language } = useI18n();
    new_content = re.sub(r'const \{ language \} = useI18n\(\);\s*const i18n = \{.*?\n\s*\}\[language\] \|\| \{[^}]*\};\n', 'const { t } = useI18n();\n', content, flags=re.DOTALL)
    
    # Sometimes it's just `}[language] || {};` without the default object
    new_content = re.sub(r'const \{ language \} = useI18n\(\);\s*const i18n = \{.*?\n\s*\}\[language\] \|\| \{\};\n', 'const { t } = useI18n();\n', new_content, flags=re.DOTALL)
    
    # Replace i18n.something with t('prefix.something')
    new_content = re.sub(r'i18n\.([a-zA-Z0-9_]+)', r"t('" + prefix + r".\1')", new_content)
    
    return new_content, translations

sim_c, sim_t = process_component(os.path.join(base_dir, 'pages', 'Simulation.jsx'), 'simulation')
ana_c, ana_t = process_component(os.path.join(base_dir, 'pages', 'Analysis.jsx'), 'analysis')
rep_c, rep_t = process_component(os.path.join(base_dir, 'pages', 'Report.jsx'), 'report')

# Now update translations.js
trans_file = os.path.join(base_dir, 'i18n', 'translations.js')
trans_content = load(trans_file)

for lang in ['en', 'fr', 'ar']:
    # Find the language block
    lang_start = re.search(rf'{lang}: \{{', trans_content)
    if not lang_start: continue
    
    insertion = f'''
    simulation: {{
      {sim_t[lang]}
    }},
    analysis: {{
      {ana_t[lang]}
    }},
    report: {{
      {rep_t[lang]}
    }},
'''
    
    matrix_end_match = re.search(r'matrix: \{.*?\n\s*\},', trans_content[lang_start.start():], re.DOTALL)
    if matrix_end_match:
        insert_pos = lang_start.start() + matrix_end_match.end()
        trans_content = trans_content[:insert_pos] + insertion + trans_content[insert_pos:]

save(trans_file, trans_content)
save(os.path.join(base_dir, 'pages', 'Simulation.jsx'), sim_c)
save(os.path.join(base_dir, 'pages', 'Analysis.jsx'), ana_c)
save(os.path.join(base_dir, 'pages', 'Report.jsx'), rep_c)

print('Done!')
