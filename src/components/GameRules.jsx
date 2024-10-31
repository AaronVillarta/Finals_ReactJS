import { Typography, Paper, Box } from '@mui/material';

function GameRules() {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>Game Rules</Typography>
      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="h6">Basic Rules:</Typography>
        <ul>
          <li>Each player starts with 3 lives</li>
          <li>Winning a round grants you +1 life</li>
          <li>Losing a round costs you 1 life</li>
          <li>Super weakness hits deal 2 lives of damage</li>
          <li>Game ends when a player reaches 0 lives</li>
        </ul>

        <Typography variant="h6">Elements:</Typography>
        <Typography>The game includes 15 elements:</Typography>
        <Typography>Rock, Paper, Scissors, Fire, Water, Air, Dragon, Devil, Lightning, Gun, Snake, Human, Tree, Wolf, and Sponge</Typography>

        <Typography variant="h6">Full Relationship Cycle:</Typography>
        <ul>
          <li>Rock pounds out Fire, crushes Scissors, Snake, Human, Wolf, Sponge, blocks (growth of) Tree.</li>
          <li>Fire melts Scissors, burns Paper, Snake, Human, Tree, Wolf & Sponge.</li>
          <li>Scissors swish through Air, carve Tree, cut Paper, Snake, Human, Wolf & Sponge.</li>
          <li>Snake bites Human & Wolf, swallows Sponge, nests in Tree & Paper, breathes Air, drinks Water.</li>
          <li>Human plants Tree, tames Wolf, cleans with Sponge, writes Paper, breathes Air, drinks Water, slays Dragon.</li>
          <li>Tree shelters Wolf & Dragon, outlives Sponge, becomes Paper, produces Air, drinks Water, imprisons Devil.</li>
          <li>Wolf chews up Sponge & Paper, breathes Air, drinks Water, outruns Dragon & Lightning, bites Devil's heiny.</li>
          <li>Sponge soaks Paper, uses Air pockets, absorbs Water, cleanses Devil & Dragon, cleans Gun, conducts Lightning.</li>
          <li>Paper fans Air, covers Rock, floats on Water, rebukes Devil & Dragon, outlaws Gun, defines Lightning.</li>
          <li>Air blows out Fire, erodes Rock, evaporates Water, chokes Devil, tarnishes Gun, freezes Dragon, creates Lightning.</li>
          <li>Water drowns Devil & Dragon, erodes Rock, puts out Fire, rusts Scissors & Gun, conducts Lightning.</li>
          <li>Dragon commands Devil, breathes Lightning & Fire, rests on Rock, immune to Scissors & Gun, spawns Snake.</li>
          <li>Devil hurls Rock, breathes Fire, immune to Scissors & Gun, casts Lightning, eats Snakes, possesses Human.</li>
          <li>Lightning melts Gun & Scissors, splits Rock & Tree, starts Fire, strikes Snake & Human.</li>
          <li>Gun targets Rock & Tree, fires, outclasses Scissors, shoots Snake, Human & Wolf.</li>
        </ul>
      </Box>
    </Paper>
  );
}

export default GameRules; 