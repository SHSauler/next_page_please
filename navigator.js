(() => {
  let config = {
    excludePatterns: ['feedback', 'rating', 'comment', 'preview'],
    enabled: true,
    customExclusions: [],
    nextKeywords: ['next', 'forward', 'siguiente', 'próximo', 'weiter'],
    prevKeywords: ['prev', 'previous', 'back', 'anterior', 'zurück']
  };

  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get('navigatorConfig');
      if (result.navigatorConfig) {
        config = { ...config, ...result.navigatorConfig };
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  const fixedPatterns = {
    next: [/›/, /»/],
    prev: [/‹/, /«/]
  };

  function shouldExclude(element) {
    const text = element.textContent.trim();
    const ariaLabel = element.getAttribute('aria-label') || '';
    const title = element.getAttribute('title') || '';
    const contentToCheck = `${text} ${ariaLabel} ${title}`.toLowerCase();

    const allExclusions = [...config.excludePatterns, ...config.customExclusions];
    return allExclusions.some(pattern => 
      contentToCheck.includes(pattern.toLowerCase())
    );
  }

  function findNavElements() {
    const elements = document.querySelectorAll('a, button');
    const navigation = {
      next: null,
      prev: null
    };

    elements.forEach(element => {
      if (shouldExclude(element)) return;

      const text = element.textContent.trim();
      const ariaLabel = element.getAttribute('aria-label') || '';
      const title = element.getAttribute('title') || '';
      const rel = element.getAttribute('rel') || '';
      const contentToCheck = `${text} ${ariaLabel} ${title} ${rel}`.toLowerCase();

      if (!navigation.next) {
        const hasNextKeyword = config.nextKeywords.some(keyword => 
          contentToCheck.includes(keyword.toLowerCase())
        );
        const hasNextSymbol = fixedPatterns.next.some(pattern => 
          pattern.test(contentToCheck)
        );
        if (hasNextKeyword || hasNextSymbol) {
          navigation.next = element;
        }
      }

      if (!navigation.prev) {
        const hasPrevKeyword = config.prevKeywords.some(keyword => 
          contentToCheck.includes(keyword.toLowerCase())
        );
        const hasPrevSymbol = fixedPatterns.prev.some(pattern => 
          pattern.test(contentToCheck)
        );
        if (hasPrevKeyword || hasPrevSymbol) {
          navigation.prev = element;
        }
      }
    });

    return navigation;
  }

  function handleKeyPress(event) {
    if (!config.enabled) return;
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    const navigation = findNavElements();

    if (event.key === 'ArrowRight' && navigation.next) {
      event.preventDefault();
      navigation.next.click();
    } else if (event.key === 'ArrowLeft' && navigation.prev) {
      event.preventDefault();
      navigation.prev.click();
    }
  }

  loadConfig().then(() => {
    document.addEventListener('keydown', handleKeyPress);
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.navigatorConfig) {
      config = changes.navigatorConfig.newValue;
    }
  });
})();