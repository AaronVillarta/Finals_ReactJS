export const ELEMENTS = [
  'Rock', 'Paper', 'Scissors', 'Fire', 'Water', 
  'Air', 'Dragon', 'Devil', 'Lightning', 'Gun', 
  'Snake', 'Human', 'Tree', 'Wolf', 'Sponge'
];

export const WINNING_COMBINATIONS = {
  Rock: ['Fire', 'Scissors', 'Snake', 'Human', 'Wolf', 'Sponge', 'Tree'],
  Paper: ['Air', 'Rock', 'Water', 'Devil', 'Dragon', 'Gun', 'Lightning'],
  Scissors: ['Air', 'Tree', 'Paper', 'Snake', 'Human', 'Wolf', 'Sponge'],
  Fire: ['Scissors', 'Paper', 'Snake', 'Human', 'Tree', 'Wolf', 'Sponge'],
  Water: ['Devil', 'Dragon', 'Rock', 'Fire', 'Scissors', 'Gun', 'Lightning'],
  Air: ['Fire', 'Rock', 'Water', 'Devil', 'Gun', 'Dragon', 'Lightning'],
  Dragon: ['Devil', 'Lightning', 'Fire', 'Rock', 'Scissors', 'Gun', 'Snake'],
  Devil: ['Rock', 'Fire', 'Scissors', 'Gun', 'Snake', 'Human', 'Lightning'],
  Lightning: ['Gun', 'Scissors', 'Rock', 'Tree', 'Fire', 'Snake', 'Human'],
  Gun: ['Rock', 'Tree', 'Scissors', 'Snake', 'Human', 'Wolf', 'Sponge'],
  Snake: ['Human', 'Wolf', 'Sponge', 'Tree', 'Paper', 'Air', 'Water'],
  Human: ['Tree', 'Wolf', 'Sponge', 'Paper', 'Air', 'Water', 'Dragon'],
  Tree: ['Wolf', 'Dragon', 'Sponge', 'Paper', 'Air', 'Water', 'Devil'],
  Wolf: ['Sponge', 'Paper', 'Air', 'Water', 'Dragon', 'Devil', 'Lightning'],
  Sponge: ['Paper', 'Air', 'Water', 'Devil', 'Dragon', 'Gun', 'Lightning']
};

export const SUPER_WEAKNESSES = {
  Rock: 'Paper',
  Paper: 'Scissors',
  Scissors: 'Rock',
  Fire: 'Water',
  Water: 'Sponge',
  Air: 'Tree',
  Dragon: 'Lightning',
  Devil: 'Human',
  Lightning: 'Gun',
  Gun: 'Snake',
  Snake: 'Wolf',
  Human: 'Devil',
  Tree: 'Fire',
  Wolf: 'Dragon',
  Sponge: 'Air'
}; 