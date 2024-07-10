import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import objectivec from 'highlight.js/lib/languages/objectivec';
import bash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('python', json);
hljs.registerLanguage('objectivec', objectivec);
hljs.registerLanguage('bash', bash);

export default hljs;
