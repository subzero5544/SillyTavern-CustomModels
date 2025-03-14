import { saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

const settings = {
    provider: {
        claude: [],
        openai: [],
        google: [],
        cohere: [],
        deepseek: [],
        mistralai: [], // Keep MistralAI here
    },
    openai_model: undefined,
    claude_model: undefined,
    google_model: undefined,
    cohere_model: undefined,
    deepseek_model: undefined,
    mistralai_model: undefined,
};

// IMPORTANT:  Initialization after loading extension_settings
Object.assign(settings, extension_settings.customModels ?? {});

// Initialize ALL providers if they are missing
for (const providerName of Object.keys(settings.provider)) {
    if (!settings.provider[providerName]) {
        settings.provider[providerName] = [];
    }
    if (settings[`${providerName}_model`] === undefined) {
        settings[`${providerName}_model`] = undefined;
    }
}

// ... (Rest of the code remains the same, from the "old popups" section) ...
let popupCaller;
let popupType;
let popupResult;
try {
    const popup = await import('../../../popup.js');
    popupCaller = popup.callGenericPopup;
    popupType = popup.POPUP_TYPE;
    popupResult = popup.POPUP_RESULT;
} catch {
    popupCaller = (await import('../../../../script.js')).callPopup;
    popupType = {
        TEXT: 1,
    };
    popupResult = {
        AFFIRMATIVE: 1,
    };
}

for (const [provider, models] of Object.entries(settings.provider)) {
    const sel = /**@type {HTMLSelectElement}*/(document.querySelector(`#model_${provider}_select`));
    // Robustness check:  Ensure the <select> element exists
    if (!sel) {
        console.error(`Could not find select element for provider: ${provider}`);
        continue; // Skip to the next provider
    }

    const h4 = sel.parentElement.querySelector('h4');
      // Robustness check:  Ensure the <h4> element exists
     if (!h4) {
        console.error(`Could not find h4 element for provider: ${provider}`);
        continue; // Skip to the next provider
    }
    const btn = document.createElement('div'); {
        btn.classList.add('stcm--btn');
        btn.classList.add('menu_button');
        btn.classList.add('fa-solid', 'fa-fw', 'fa-pen-to-square');
        btn.title = 'Edit custom models';
        btn.addEventListener('click', async()=>{
            let inp;
            const dom = document.createElement('div'); {
                const header = document.createElement('h3'); {
                    header.textContent = `Custom Models: ${provider}`;
                    dom.append(header);
                }
                const hint = document.createElement('small'); {
                    hint.textContent = 'one model name per line';
                    dom.append(hint);
                }
                inp = document.createElement('textarea'); {
                    inp.classList.add('text_pole');
                    inp.rows = 20;
                    inp.value = models.join('\n');
                    dom.append(inp);
                }
            }
            const prom = popupCaller(dom, popupType.TEXT, null, { okButton: 'Save' });
            const result = await prom;
            if (result == popupResult.AFFIRMATIVE) {
                while (models.pop());
                models.push(...inp.value.split('\n').filter(it=>it.length));
                extension_settings.customModels = settings;
                saveSettingsDebounced();
                populateOptGroup();
                if (settings[`${provider}_model`] && models.includes(settings[`${provider}_model`])) {
                    sel.value = settings[`${provider}_model`];
                    sel.dispatchEvent(new Event('change', { bubbles:true }));
                }
            }
        });
        h4.append(btn);
    }
    const populateOptGroup = ()=>{
        grp.innerHTML = '';
        for (const model of models) {
            const opt = document.createElement('option'); {
                opt.value = model;
                opt.textContent = model;
                grp.append(opt);
            }
        }
    };
    const grp = document.createElement('optgroup'); {
        grp.label = 'Custom Models';
        populateOptGroup();
        sel.insertBefore(grp, sel.children[0]);
    }
    if (settings[`${provider}_model`] && models.includes(settings[`${provider}_model`])) {
        sel.value = settings[`${provider}_model`];
        sel.dispatchEvent(new Event('change', { bubbles:true }));
    }
    sel.addEventListener('change', (evt)=>{
        evt.stopImmediatePropagation();
        if (settings[`${provider}_model`] != sel.value) {
            settings[`${provider}_model`] = sel.value;
            extension_settings.customModels = settings;
            saveSettingsDebounced();
        }
    });
}
