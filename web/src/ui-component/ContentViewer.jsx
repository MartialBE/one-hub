import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { marked } from 'marked';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import 'assets/css/content-viewer.css';

/**
 * ContentViewer component for displaying Markdown or HTML content
 * 
 * @param {Object} props - Component props
 * @param {string} props.content - The content to display (Markdown, HTML, or URL)
 * @param {boolean} props.loading - Whether the content is loading
 * @param {string} props.errorMessage - Error message to display if loading fails
 * @param {Object} props.containerStyle - Additional styles for the container
 * @param {Object} props.contentStyle - Additional styles for the content
 * @param {number} props.iframeHeight - Height for iframe (when content is a URL)
 * @returns {React.ReactElement} The rendered component
 */
const ContentViewer = ({ 
  content, 
  loading = false, 
  errorMessage = '', 
  containerStyle = {}, 
  contentStyle = {},
  iframeHeight = '100vh'
}) => {
  const [parsedContent, setParsedContent] = useState('');
  const [isUrl, setIsUrl] = useState(false);

  useEffect(() => {
    if (!content) {
      setParsedContent('');
      setIsUrl(false);
      return;
    }

    // Check if content is a URL
    if (content.startsWith('http://') || content.startsWith('https://')) {
      setIsUrl(true);
      setParsedContent(content);
      return;
    }

    // Check if content is already HTML
    if (content.trim().startsWith('<') && content.includes('</')) {
      setIsUrl(false);
      setParsedContent(content);
      return;
    }

    // Parse as Markdown
    try {
      const parsed = marked.parse(content);
      setParsedContent(parsed);
      setIsUrl(false);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      setParsedContent(content); // Fallback to raw content
      setIsUrl(false);
    }
  }, [content]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          ...containerStyle
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          ...containerStyle
        }}
      >
        <Typography color="error" variant="body1">{errorMessage}</Typography>
      </Box>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        overflow: 'hidden',
        backgroundColor: 'transparent',
        ...containerStyle
      }}
    >
      {isUrl ? (
        <iframe 
          title="content-frame" 
          src={parsedContent} 
          style={{ 
            width: '100%', 
            height: iframeHeight, 
            border: 'none',
            ...contentStyle
          }} 
        />
      ) : (
        <Box 
          className="content-viewer"
          sx={{ 
            fontSize: 'inherit',
            lineHeight: 1.6,
            '& img': {
              maxWidth: '100%',
              height: 'auto'
            },
            ...contentStyle
          }} 
          dangerouslySetInnerHTML={{ __html: parsedContent }}
        />
      )}
    </Paper>
  );
};

ContentViewer.propTypes = {
  content: PropTypes.string,
  loading: PropTypes.bool,
  errorMessage: PropTypes.string,
  containerStyle: PropTypes.object,
  contentStyle: PropTypes.object,
  iframeHeight: PropTypes.string
};

export default ContentViewer;
