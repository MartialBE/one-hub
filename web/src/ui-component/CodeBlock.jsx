import PropTypes from 'prop-types';

import React, { useEffect, useRef, useState } from 'react';
import hljs from './highlight';
import { copy } from 'utils/common';

import 'assets/css/dracula.css';

export default function CodeBlock({ language, code }) {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preRef.current) {
      hljs.highlightElement(preRef.current);
    }
  }, [code]);

  return (
    <div className="code-block" style={{ position: 'relative', marginTop: 8 }}>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        <code id={language} ref={preRef} className={language}>
          {code}
        </code>
      </pre>
      <button
        id={`${language}copy_btn`}
        style={{ position: 'absolute', top: 4, right: 4, lineHeight: '14px' }}
        className="code-block__button"
        data-clipboard-target={`#${language}`}
        onClick={() => {
          copy(code, `#${language}`);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 1500);
        }}
        // disabled={!preRef.current}
      >
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  );
}

CodeBlock.propTypes = {
  language: PropTypes.string,
  code: PropTypes.string
};
