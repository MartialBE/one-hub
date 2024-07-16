import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Avatar, ListItemText, Grid, Typography } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CodeBlock from 'ui-component/CodeBlock';
import { useTranslation } from 'react-i18next';

export default function SunoMusic({ items }) {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState(items[0]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={7}>
        {items.map((item) => (
          <Item key={item.id} item={item} isSelected={item.id === selectedItem.id} onClick={() => setSelectedItem(item)} />
        ))}
      </Grid>

      <Grid item xs={5}>
        {selectedItem && (
          <>
            <Accordion>
              <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="audio-content" id="audio-header">
                <Typography>{t('suno.music')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <audio controls src={selectedItem.audio_url} style={{ width: '100%' }}>
                  <track kind="captions" />
                </audio>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="video-content" id="video-header">
                <Typography>{t('suno.video')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <video controls src={selectedItem.video_url} style={{ width: '100%', marginTop: '20px' }}>
                  <track kind="captions" />
                </video>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="video-content" id="video-header">
                <Typography>{t('suno.lyrics')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock code={selectedItem.metadata.prompt} />
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="video-content" id="video-header">
                <Typography>{t('suno.response')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock language="json" code={JSON.stringify(selectedItem, null, 2)} />
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </Grid>
    </Grid>
  );
}

SunoMusic.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object)
};

function Item({ item, isSelected, onClick, sx, ...other }) {
  return (
    <Box
      sx={{
        py: 2,
        px: 3,
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `dashed 1px`,
        backgroundColor: isSelected ? 'rgba(173, 216, 230, 0.3)' : 'transparent',
        cursor: 'pointer',
        ...sx
      }}
      onClick={onClick}
      {...other}
    >
      <Avatar variant="rounded" alt={item.title} src={item.image_url} sx={{ width: 48, height: 48, flexShrink: 0 }} />

      <ListItemText
        primary={item.title}
        secondary={TruncatedText(item.metadata.prompt)}
        primaryTypographyProps={{ noWrap: true, typography: 'subtitle2' }}
        secondaryTypographyProps={{ mt: 0.5, noWrap: true, component: 'span' }}
      />
    </Box>
  );
}

Item.propTypes = {
  item: PropTypes.any,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
  sx: PropTypes.any
};

function TruncatedText(text) {
  return text.length > 30 ? text.substring(0, 30) + '...' : text;
}
