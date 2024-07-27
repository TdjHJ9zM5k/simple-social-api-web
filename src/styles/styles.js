import { Avatar, ListItem } from '@mui/material';
import { styled } from '@mui/system';

export const StyledListItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const FollowedAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  marginRight: '16px',
}));

export const DefaultAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.grey[400],
  color: theme.palette.common.white,
  marginRight: '16px',
}));

export const postStyles = {
  post: {
    fontWeight: 'bold',
  },
  authorAndDate: {
    marginTop: '8px',
    fontStyle: 'italic',
  },
  comment: {
    marginTop: '8px',
  },
  commentDetails: {
    fontStyle: 'italic',
  },
};