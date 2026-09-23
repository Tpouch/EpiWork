import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'periwinkle',
  colors: {
    periwinkle: [
      '#EEF0FF', '#DCE0FF', '#B8C0E8', '#A3AEFB', '#8E9AFB',
      '#809DFD', '#6B79E8', '#5561C9', '#4048A8', '#2E3488',
    ],
    dark: [
      '#FFFFFF', '#C9C9C9', '#B8B8B8', '#828282', '#696969',
      '#424242', '#3B3B3B', '#2E2E2E', '#242424', '#181818',
    ],
  },
  fontFamily: '"IBM Plex Sans", sans-serif',
  headings: { fontFamily: '"Anton", sans-serif', textTransform: 'uppercase' },
  defaultRadius: 'sm',
});

export const signalColors = {
  needsHelp: '#FF5F3A',
  needsHelpText: '#FF9980',
  awaitingReview: '#29D9FF',
  done: '#00FF97',
  sectionBar: '#FF1EF7',
  destructive: '#EF4B4B',
};
