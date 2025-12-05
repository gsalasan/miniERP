import React from 'react';
import { Card, CardContent, CardHeader, Box, Divider } from '@mui/material';
import type { SxProps } from '@mui/system';

interface Props {
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  sx?: SxProps;
}

const SectionCard: React.FC<Props> = ({ title, subheader, icon, children, sx }) => {
  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        ...((sx as any) || {}),
      }}
    >
      {(title || subheader) && (
        <>
          <CardHeader
            avatar={icon ? <Box sx={{ mt: 0.5 }}>{icon}</Box> : undefined}
            title={title}
            subheader={subheader}
            sx={{ pb: 0 }}
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
            subheaderTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
          />
          <Divider />
        </>
      )}
      <CardContent sx={{ pt: title || subheader ? 2 : 2, pb: 2, flexGrow: 1 }}>{children}</CardContent>
    </Card>
  );
};

export default SectionCard;
