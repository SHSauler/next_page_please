const defaultConfig = {
    excludePatterns: ['feedback', 'rating', 'comment'],
    enabled: true,
    customExclusions: [],
    nextKeywords: ['next', 'forward', 'siguiente', 'próximo', 'weiter'],
    prevKeywords: ['prev', 'previous', 'back', 'anterior', 'zurück']
  };
  
  document.addEventListener('DOMContentLoaded', async () => {
    const result = await chrome.storage.local.get('navigatorConfig');
    const config = result.navigatorConfig || {...defaultConfig};
  
    document.getElementById('enabled').checked = config.enabled;
  
    function createBubble(text, type) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      
      const span = document.createElement('span');
      span.textContent = text;
      
      const button = document.createElement('button');
      button.className = 'remove';
      button.textContent = '×';
      button.dataset.type = type;
      button.dataset.value = text;
      
      bubble.appendChild(span);
      bubble.appendChild(button);
      
      return bubble;
    }
  
    function updateList(listId, items, itemType) {
      const list = document.getElementById(listId);
      if (!list || !items) return;
      
      list.innerHTML = '';
      items.forEach(item => {
        list.appendChild(createBubble(item, itemType));
      });
    }
  
    function updateAllLists() {
      const exclusions = [...(config.excludePatterns || []), ...(config.customExclusions || [])];
      updateList('exclusionList', exclusions, 'exclusion');
      updateList('nextKeywordsList', config.nextKeywords || [], 'nextKeyword');
      updateList('prevKeywordsList', config.prevKeywords || [], 'prevKeyword');
    }
  
    async function saveConfig() {
      await chrome.storage.local.set({ navigatorConfig: config });
      updateAllLists();
    }
  
    document.getElementById('enabled').addEventListener('change', (e) => {
      config.enabled = e.target.checked;
      saveConfig();
    });
  
    function addItem(inputId, array, type) {
      const input = document.getElementById(inputId);
      const value = input.value.trim().toLowerCase();
      if (value && !array.includes(value)) {
        array.push(value);
        saveConfig();
        input.value = '';
      }
    }
  
    document.getElementById('addExclusion').addEventListener('click', () => {
      if (!config.customExclusions) config.customExclusions = [];
      addItem('newExclusion', config.customExclusions, 'exclusion');
    });
  
    document.getElementById('addNextKeyword').addEventListener('click', () => {
      if (!config.nextKeywords) config.nextKeywords = [];
      addItem('newNextKeyword', config.nextKeywords, 'nextKeyword');
    });
  
    document.getElementById('addPrevKeyword').addEventListener('click', () => {
      if (!config.prevKeywords) config.prevKeywords = [];
      addItem('newPrevKeyword', config.prevKeywords, 'prevKeyword');
    });
  
    ['newExclusion', 'newNextKeyword', 'newPrevKeyword'].forEach(id => {
      document.getElementById(id).addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById(id.replace('new', 'add')).click();
        }
      });
    });
  
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove')) {
        const type = e.target.dataset.type;
        const value = e.target.dataset.value;
        
        if (type === 'exclusion' && !config.excludePatterns.includes(value)) {
          config.customExclusions = (config.customExclusions || []).filter(item => item !== value);
        } else if (type === 'nextKeyword') {
          config.nextKeywords = (config.nextKeywords || []).filter(item => item !== value);
        } else if (type === 'prevKeyword') {
          config.prevKeywords = (config.prevKeywords || []).filter(item => item !== value);
        }
        
        saveConfig();
      }
    });
  
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const content = document.getElementById(tab.dataset.tab);
        content.classList.add('active');
      });
    });
  
    document.getElementById('resetDefaults').addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all settings to default?')) {
        Object.assign(config, {...defaultConfig});
        await saveConfig();
      }
    });
  
    updateAllLists();
  });