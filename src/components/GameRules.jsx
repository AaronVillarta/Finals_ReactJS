import { Typography, Box, IconButton, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { useState, useEffect } from 'react';
import 'react-resizable/css/styles.css';
import './GameRules.css';

function GameRules({ onClose }) {
  // Get saved size from localStorage or use default
  const [size, setSize] = useState(() => {
    const savedSize = localStorage.getItem('gameRulesSize');
    return savedSize ? JSON.parse(savedSize) : { width: 400, height: 600 };
  });

  const [scale, setScale] = useState(1);

  // Save size to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gameRulesSize', JSON.stringify(size));
  }, [size]);

  useEffect(() => {
    const widthScale = size.width / 400;
    const heightScale = size.height / 600;
    const newScale = Math.min(widthScale, heightScale);
    setScale(Math.max(0.5, Math.min(1.5, newScale)));
  }, [size.width, size.height]);

  // Handle window resize
  const handleResize = (e, { size: newSize }) => {
    setSize(newSize);
  };

  const fontSize = {
    h5: 24 * scale,
    h6: 20 * scale,
    body: 16 * scale,
    li: 16 * scale
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        backgroundColor: 'transparent',
        pointerEvents: 'none'
      }}
    >
      <Draggable 
        defaultPosition={{ x: window.innerWidth / 2 - size.width/2, y: window.innerHeight / 2 - size.height/2 }}
        bounds="parent"
        handle=".drag-handle"
      >
        <ResizableBox
          width={size.width}
          height={size.height}
          minConstraints={[200, 300]}
          maxConstraints={[800, 800]}
          onResize={handleResize}
          resizeHandles={['se']}
          style={{ pointerEvents: 'auto' }}
        >
          <Paper 
            elevation={24}
            sx={{ 
              width: '100%',
              height: '100%',
              p: 3, 
              position: 'relative',
              bgcolor: 'background.paper',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box 
              className="drag-handle"
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                cursor: 'move'
              }}
            >
              <Typography sx={{ fontSize: fontSize.h5 }}>
                Game Rules
              </Typography>
              <IconButton 
                onClick={onClose}
                sx={{ 
                  cursor: 'pointer',
                  transform: `scale(${scale})`,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box 
              sx={{ 
                height: 'calc(100% - 60px)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'hidden',
              }}
            >
              <Box sx={{ 
                textAlign: 'left',
                flex: 1,
                overflowY: 'auto',
                // Hide scrollbar for Firefox
                scrollbarWidth: 'none',
                // Hide scrollbar for Chrome/Safari/Opera
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                // Hide scrollbar for IE/Edge
                msOverflowStyle: 'none',
                '& ul': {
                  margin: 1 * scale,
                  paddingLeft: 3 * scale
                },
                '& li': {
                  fontSize: fontSize.li,
                  marginBottom: 0.5 * scale
                }
              }}>
                <Typography sx={{ fontSize: fontSize.h6, mb: 1 * scale }}>
                  Basic Rules:
                </Typography>
                <ul>
                  <li>Each player starts with 3 lives</li>
                  <li>Winning a round grants you +1 life</li>
                  <li>Losing a round costs you 1 life</li>
                  <li>Super weakness hits deal 2 lives of damage</li>
                  <li>Game ends when a player reaches 0 lives</li>
                </ul>

                <Typography sx={{ fontSize: fontSize.h6, mb: 1 * scale, mt: 2 * scale }}>
                  Elements:
                </Typography>
                <Typography sx={{ fontSize: fontSize.body }}>
                  The game includes 15 elements:
                </Typography>
                <Typography sx={{ fontSize: fontSize.body }}>
                  Rock, Paper, Scissors, Fire, Water, Air, Dragon, Devil, Lightning, Gun, Snake, Human, Tree, Wolf, and Sponge
                </Typography>

                <Typography sx={{ fontSize: fontSize.h6, mb: 1 * scale, mt: 2 * scale }}>
                  Full Relationship Cycle:
                </Typography>
                <Box sx={{ 
                  overflowX: 'auto',
                  maxHeight: '100%',
                  position: 'relative',
                  // Hide scrollbar for Firefox
                  scrollbarWidth: 'none',
                  // Hide scrollbar for Chrome/Safari/Opera
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  },
                  // Hide scrollbar for IE/Edge
                  msOverflowStyle: 'none',
                  '& table': {
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    width: '100%',
                    minWidth: '300px',
                  },
                  '& th': {
                    backgroundColor: '#14131c',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: fontSize.h6,
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    borderBottom: '2px solid #1a237e',
                  },
                  '& th, & td': {
                    border: '1px solid rgba(224, 224, 224, 1)',
                    padding: 1 * scale,
                    fontSize: fontSize.body,
                    textAlign: 'left',
                  },
                  '& tr:nth-of-type(even) td': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  },
                  '& tr:hover td': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '15%' }}>Element</th>
                        <th style={{ width: '45%' }}>Defeats</th>
                        <th style={{ width: '20%' }}>Super Effective Against</th>
                        <th style={{ width: '20%' }}>Super Weak To</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Rock</strong></td>
                        <td>Fire, Scissors, Snake, Human, Wolf, Sponge, Tree</td>
                        <td>Scissors</td>
                        <td>Paper</td>
                      </tr>
                      <tr>
                        <td><strong>Fire</strong></td>
                        <td>Scissors, Paper, Snake, Human, Tree, Wolf, Sponge</td>
                        <td>Tree</td>
                        <td>Water</td>
                      </tr>
                      <tr>
                        <td><strong>Scissors</strong></td>
                        <td>Air, Tree, Paper, Snake, Human, Wolf, Sponge</td>
                        <td>Paper</td>
                        <td>Rock</td>
                      </tr>
                      <tr>
                        <td><strong>Snake</strong></td>
                        <td>Human, Wolf, Sponge, Tree, Paper, Air, Water</td>
                        <td>Gun</td>
                        <td>Wolf</td>
                      </tr>
                      <tr>
                        <td><strong>Human</strong></td>
                        <td>Tree, Wolf, Sponge, Paper, Air, Water, Dragon</td>
                        <td>Wolf</td>
                        <td>Devil</td>
                      </tr>
                      <tr>
                        <td><strong>Tree</strong></td>
                        <td>Wolf, Dragon, Sponge, Paper, Air, Water, Devil</td>
                        <td>Air</td>
                        <td>Fire</td>
                      </tr>
                      <tr>
                        <td><strong>Wolf</strong></td>
                        <td>Sponge, Paper, Air, Water, Dragon, Devil, Lightning</td>
                        <td>Snake</td>
                        <td>Human</td>
                      </tr>
                      <tr>
                        <td><strong>Sponge</strong></td>
                        <td>Paper, Air, Water, Devil, Dragon, Gun, Lightning</td>
                        <td>Water</td>
                        <td>Air</td>
                      </tr>
                      <tr>
                        <td><strong>Paper</strong></td>
                        <td>Air, Rock, Water, Devil, Dragon, Gun, Lightning</td>
                        <td>Rock</td>
                        <td>Scissors</td>
                      </tr>
                      <tr>
                        <td><strong>Air</strong></td>
                        <td>Fire, Rock, Water, Devil, Gun, Dragon, Lightning</td>
                        <td>Sponge</td>
                        <td>Tree</td>
                      </tr>
                      <tr>
                        <td><strong>Water</strong></td>
                        <td>Devil, Dragon, Rock, Fire, Scissors, Gun, Lightning</td>
                        <td>Fire</td>
                        <td>Sponge</td>
                      </tr>
                      <tr>
                        <td><strong>Dragon</strong></td>
                        <td>Devil, Lightning, Fire, Rock, Scissors, Gun, Snake</td>
                        <td>Wolf</td>
                        <td>Lightning</td>
                      </tr>
                      <tr>
                        <td><strong>Devil</strong></td>
                        <td>Rock, Fire, Scissors, Gun, Snake, Human, Lightning</td>
                        <td>Human</td>
                        <td>Gun</td>
                      </tr>
                      <tr>
                        <td><strong>Lightning</strong></td>
                        <td>Gun, Scissors, Rock, Tree, Fire, Snake, Human</td>
                        <td>Dragon</td>
                        <td>Gun</td>
                      </tr>
                      <tr>
                        <td><strong>Gun</strong></td>
                        <td>Rock, Tree, Scissors, Snake, Human, Wolf, Sponge</td>
                        <td>Devil</td>
                        <td>Snake</td>
                      </tr>
                    </tbody>
                  </table>
                </Box>
              </Box>
            </Box>
          </Paper>
        </ResizableBox>
      </Draggable>
    </div>
  );
}

export default GameRules;