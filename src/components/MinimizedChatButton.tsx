import React from 'react';
import {
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Chat as ChatIcon
} from '@mui/icons-material';

interface MinimizedChatButtonProps {
  onExpand: () => void;
}

const MinimizedChatButton: React.FC<MinimizedChatButtonProps> = ({ onExpand }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 24 },
        right: { xs: 16, md: 24 },
        zIndex: 1000
      }}
    >
      <Tooltip title="Open AI Assistant">
        <IconButton
          onClick={onExpand}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            width: { xs: 56, md: 64 },
            height: { xs: 56, md: 64 },
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s',
            boxShadow: 3
          }}
        >
          <ChatIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default MinimizedChatButton;