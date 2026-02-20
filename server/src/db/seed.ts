import { query } from './database';

interface CardSeed {
  card_type: string;
  card_text: string;
  expansion: string;
}

const cards: CardSeed[] = [
  // === CORE ===
  { card_type: 'dare', card_text: 'Sit on another players lap until your next turn (or they can sit on yours)', expansion: 'core' },
  { card_type: 'dare', card_text: 'Remove an article of clothing.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Fake an orgasm.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Flash or moon everyone.', expansion: 'core' },
  { card_type: 'group', card_text: 'All players of the opposite sex remove an article of clothing.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Give a 30 second lap dance to another player.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Whisper "I want to fuck the shit out of you," or something similarly filthy into another players ear.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Get 5 spanks from another player.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Blow a raspberry on the stomach of another player.', expansion: 'core' },
  { card_type: 'challenge', card_text: 'Use your best pick up line on another player. They use theirs on you. The group picks the winner.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Let everyone grab your ass.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Do a body shot off another player.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Survive 30 seconds of being tickled by another player.', expansion: 'core' },
  { card_type: 'challenge', card_text: 'Go around the room and name different sex toys. First hesitation or repeat loses.', expansion: 'core' },
  { card_type: 'challenge', card_text: 'Spin the bottle. Kiss that player, or pass your spin to them.', expansion: 'core' },
  { card_type: 'challenge', card_text: 'Tell two truths and a lie. Choose a player to answer.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Show the group a photo from your secret collection.', expansion: 'core' },
  { card_type: 'group', card_text: 'On 3, everyone point to the player who has partaken in the most anal.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Pin, or let another player pin you against the wall for 30 seconds.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Choose another player to remove an article of clothing from you.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Use your foot to rub another players crotch for 30 seconds.', expansion: 'core' },
  { card_type: 'challenge', card_text: 'Wild Card - This card allows you to choose what you want done to you and by whom.', expansion: 'core' },
  { card_type: 'group', card_text: 'Everyone who has had sex in the last 24 hours, removes an article of clothing.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Let another player unbutton or unzip one item of your clothing and leave it that way.', expansion: 'core' },
  { card_type: 'dare', card_text: 'Give another player a slow, 60-second back or shoulder massage.', expansion: 'core' },
  { card_type: 'group', card_text: 'Everyone close their eyes. On 3 point to the player in the room with the best body. Open your eyes.', expansion: 'core' },

  // === VANILLA ===
  { card_type: 'truth', card_text: 'Have you ever had a threesome?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Point to the players in the room you want to see fuck each other the most.', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What is your record for how many times you\'ve masturbated in a 24 hour period?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What is your favorite sex position?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Name your most unusual celebrity crush.', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever filmed a porno?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever given or received road head?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Are you a member of the mile high club?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What was the last role play scenario you and your partner performed?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Would you rather watch your partner have a threesome with another couple or have your partner watch you?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever had anal sex? Did you enjoy it?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Do you like to be spanked? Are you into dom/sub play or any sort during sex?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever done anything sexual with someone of the same sex? If not, would you?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Voyeur or Exhibitionist?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Name two places, outside of the house, where you would like to have sex.', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What turns you off?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Is there anything you won\'t do in bed?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Describe your sexual fantasy in as much detail as possible.', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'If you could have sex with any celebrity, whom would you choose?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What is the most embarrassing thing you\'ve done to get someone\'s attention?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever lied to get someone into bed? What did you say?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What body part on another person do you notice first? Who in the group has the best?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever had a sex dream about someone in this room?', expansion: 'vanilla' },
  { card_type: 'challenge', card_text: 'Make prolonged eye contact with the player across from you for 60 seconds without laughing or looking away.', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever hooked up with someone you met that same night? How did it go?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever sent or received a nude photo? Any regrets?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever had sex in a public place with a real risk of being caught?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What is the most adventurous place you have ever had sex or fooled around?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever faked being asleep to avoid or initiate sex?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What is the longest you have gone without sex as an adult — and what broke the streak?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'What is a sexual experience you have had that you have never told anyone about?', expansion: 'vanilla' },
  { card_type: 'truth', card_text: 'Have you ever been caught in the act? What happened?', expansion: 'vanilla' },

  // === PINEAPPLE ===
  { card_type: 'dare', card_text: 'Check a player for breast or testicular cancer.', expansion: 'pineapple' },
  { card_type: 'challenge', card_text: 'Give another player a semi-chub, or erect nipple in 30 seconds or less.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Motorboat another player.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Sit on another players lap (or they can sit on yours) and give them a hickey.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Have another player write their name on your tits or ass.', expansion: 'pineapple' },
  { card_type: 'challenge', card_text: 'Have two players kiss you. Pick the winner.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Rub another players crotch for 30 seconds.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Pick two people and all three of you stand. Rub them both below the waist simultaneously, while kissing one of them.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'While kissing another player, guide their hand to a place you want them to rub.', expansion: 'pineapple' },
  { card_type: 'challenge', card_text: 'Close your eyes, and a random player must kiss you. If you guess who it was, they lose.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Offer your partner to be felt up by the group for a minute.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Help another player remove an article of clothing.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Stimulate two parts of another players body at the same time. Use your hand on one part, and your mouth on another.', expansion: 'pineapple' },
  { card_type: 'challenge', card_text: 'You\'re the director. Select your cast and have them perform a short scene. If they refuse, they lose.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'You and your partner choose another player and double team them using your lips, tongue, and hands.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Text another player a nude.', expansion: 'pineapple' },
  { card_type: 'challenge', card_text: 'Seven Minutes in Heaven - Disappear to a secluded location with another player for seven minutes.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Kiss the neck of another player for 10 seconds.', expansion: 'pineapple' },
  { card_type: 'challenge', card_text: 'Two players compete to see who can whisper the most convincing dirty talk. The room votes on the winner.', expansion: 'pineapple' },
  { card_type: 'dare', card_text: 'Sit in another player\'s lap and stay there until you draw your next card.', expansion: 'pineapple' },
  { card_type: 'group', card_text: 'Every player whispers one word to describe the person on their left — something you\'d say in the bedroom.', expansion: 'pineapple' },
];

async function seed(): Promise<void> {
  try {
    // Check if cards already exist
    const result = await query('SELECT COUNT(*) as count FROM cards');
    const count = parseInt(result.rows[0].count, 10);
    
    if (count > 0) {
      console.log(`✅ Database already has ${count} cards. Skipping seed.`);
      return;
    }

    // Insert cards
    for (const card of cards) {
      await query(
        'INSERT INTO cards (card_type, card_text, expansion) VALUES ($1, $2, $3)',
        [card.card_type, card.card_text, card.expansion]
      );
    }

    // Report
    const statsResult = await query(
      `SELECT expansion, card_type, COUNT(*) as count FROM cards 
       GROUP BY expansion, card_type ORDER BY expansion, card_type`
    );

    console.log(`✅ Seeded ${cards.length} cards:`);
    for (const row of statsResult.rows) {
      console.log(`  ${row.expansion} / ${row.card_type}: ${row.count}`);
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed();
