
import { KeyConfig, Lesson, Difficulty } from './types';
import { PRIMARY_WORDS_DATA } from './word_data';

// Finger mapping: 1=L-Pinky ... 5=L-Thumb, 6=R-Thumb ... 10=R-Pinky
export const KEYBOARD_LAYOUT: KeyConfig[][] = [
  [
    { key: '`', row: 1, finger: 1, hand: 'left' },
    { key: '1', row: 1, finger: 1, hand: 'left' },
    { key: '2', row: 1, finger: 2, hand: 'left' },
    { key: '3', row: 1, finger: 3, hand: 'left' },
    { key: '4', row: 1, finger: 4, hand: 'left' },
    { key: '5', row: 1, finger: 4, hand: 'left' },
    { key: '6', row: 1, finger: 7, hand: 'right' },
    { key: '7', row: 1, finger: 7, hand: 'right' },
    { key: '8', row: 1, finger: 8, hand: 'right' },
    { key: '9', row: 1, finger: 9, hand: 'right' },
    { key: '0', row: 1, finger: 10, hand: 'right' },
    { key: '-', row: 1, finger: 10, hand: 'right' },
    { key: '=', row: 1, finger: 10, hand: 'right' },
    { key: 'Backspace', label: '⌫', width: 2, row: 1, finger: 10, hand: 'right' },
  ],
  [
    { key: 'Tab', width: 1.5, row: 2, finger: 1, hand: 'left' },
    { key: 'q', row: 2, finger: 1, hand: 'left' },
    { key: 'w', row: 2, finger: 2, hand: 'left' },
    { key: 'e', row: 2, finger: 3, hand: 'left' },
    { key: 'r', row: 2, finger: 4, hand: 'left' },
    { key: 't', row: 2, finger: 4, hand: 'left' },
    { key: 'y', row: 2, finger: 7, hand: 'right' },
    { key: 'u', row: 2, finger: 7, hand: 'right' },
    { key: 'i', row: 2, finger: 8, hand: 'right' },
    { key: 'o', row: 2, finger: 9, hand: 'right' },
    { key: 'p', row: 2, finger: 10, hand: 'right' },
    { key: '[', row: 2, finger: 10, hand: 'right' },
    { key: ']', row: 2, finger: 10, hand: 'right' },
    { key: '\\', width: 1.5, row: 2, finger: 10, hand: 'right' },
  ],
  [
    { key: 'CapsLock', label: 'Caps', width: 1.75, row: 3, finger: 1, hand: 'left' },
    { key: 'a', row: 3, finger: 1, hand: 'left' },
    { key: 's', row: 3, finger: 2, hand: 'left' },
    { key: 'd', row: 3, finger: 3, hand: 'left' },
    { key: 'f', row: 3, finger: 4, hand: 'left' },
    { key: 'g', row: 3, finger: 4, hand: 'left' },
    { key: 'h', row: 3, finger: 7, hand: 'right' },
    { key: 'j', row: 3, finger: 7, hand: 'right' },
    { key: 'k', row: 3, finger: 8, hand: 'right' },
    { key: 'l', row: 3, finger: 9, hand: 'right' },
    { key: ';', row: 3, finger: 10, hand: 'right' },
    { key: "'", row: 3, finger: 10, hand: 'right' },
    { key: 'Enter', width: 2.25, row: 3, finger: 10, hand: 'right' },
  ],
  [
    { key: 'Shift', width: 2.25, row: 4, finger: 1, hand: 'left' },
    { key: 'z', row: 4, finger: 1, hand: 'left' },
    { key: 'x', row: 4, finger: 2, hand: 'left' },
    { key: 'c', row: 4, finger: 3, hand: 'left' },
    { key: 'v', row: 4, finger: 4, hand: 'left' },
    { key: 'b', row: 4, finger: 4, hand: 'left' },
    { key: 'n', row: 4, finger: 7, hand: 'right' },
    { key: 'm', row: 4, finger: 7, hand: 'right' },
    { key: ',', row: 4, finger: 8, hand: 'right' },
    { key: '.', row: 4, finger: 9, hand: 'right' },
    { key: '/', row: 4, finger: 10, hand: 'right' },
    { key: 'Shift', width: 2.75, row: 4, finger: 10, hand: 'right' },
  ],
  [
    { key: ' ', label: 'Space', width: 6.5, row: 5, finger: 5, hand: 'left' }, // Using thumb
  ]
];

const PRIMARY_LESSONS: Lesson[] = PRIMARY_WORDS_DATA.map(d => ({
  id: `primary-g${d.grade}-t${d.term}`,
  title: `${d.grade}年级 ${d.term === 1 ? '上册' : '下册'} (Grade ${d.grade} - Term ${d.term})`,
  category: 'primary',
  difficulty: d.grade <= 2 ? Difficulty.EASY : Difficulty.MEDIUM,
  content: d.words
}));

export const STATIC_LESSONS: Lesson[] = [
  {
    id: 'basic-1',
    title: '基准键位 (Home Row)',
    category: 'basics',
    difficulty: Difficulty.EASY,
    content: 'fff jjj ddd kkk sss lll aaa ;;; asdf jkl; fjdksl a;sldkfj'
  },
  // Finger Drills
  {
    id: 'finger-index',
    title: '食指 (Index Fingers)',
    category: 'finger',
    difficulty: Difficulty.EASY,
    content: 'rfv tgb yhn ujm frftfv jujyjh rrr ttt yyy uuu ffff jjjj'
  },
  {
    id: 'finger-middle',
    title: '中指 (Middle Fingers)',
    category: 'finger',
    difficulty: Difficulty.EASY,
    content: 'edc ik, ddd ccc kkk ,,, dedc kik, ede cdc iki ,k,'
  },
  {
    id: 'finger-ring',
    title: '无名指 (Ring Fingers)',
    category: 'finger',
    difficulty: Difficulty.EASY,
    content: 'wsx ol. sss xxx lll ... swsx lol. sws xwx lol .o.'
  },
  {
    id: 'finger-pinky',
    title: '小指 (Pinky Fingers)',
    category: 'finger',
    difficulty: Difficulty.EASY,
    content: 'qaz p;/ aaa zzz ;;; /// qaqz p;p/ aza ;/;'
  },
  // Primary School Words
  ...PRIMARY_LESSONS,
  // Words & Sentences
  {
    id: 'words-1',
    title: '常见单词 100',
    category: 'words',
    difficulty: Difficulty.MEDIUM,
    content: 'the be to of and a in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what'
  },
  {
    id: 'sent-1',
    title: '励志短句 (English)',
    category: 'sentences',
    difficulty: Difficulty.MEDIUM,
    content: 'Practice makes perfect. The quick brown fox jumps over the lazy dog. Believe you can and you are halfway there.'
  },
  {
    id: 'code-1',
    title: 'JavaScript 基础',
    category: 'code',
    difficulty: Difficulty.HARD,
    content: 'const a = 10; let b = 20; function add(x, y) { return x + y; } console.log(add(a, b));'
  }
];

export const GAME_WORDS = [
  "cat", "dog", "run", "jump", "fly", "sky", "blue", "red", "fast", "slow", 
  "apple", "banana", "orange", "grape", "hello", "world", "react", "type", 
  "keyboard", "mouse", "screen", "code", "learn", "school", "friend", "happy"
];
