const checklistItems = [
  { id: 'greeting', label: '挨拶', weight: 0.15 },
  { id: 'listening', label: '傾聴', weight: 0.25 },
  { id: 'checking', label: '確認', weight: 0.2 },
  { id: 'explaining', label: '説明', weight: 0.2 },
  { id: 'closing', label: '締め', weight: 0.2 }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calcVectorScore = (text) => {
  const richness = clamp(text.length / 220, 0.3, 1);
  const diversity = clamp(
    new Set(text.split(/\s+/)).size / Math.max(text.split(/\s+/).length, 1),
    0.3,
    1
  );
  const raw = 60 + richness * 25 + diversity * 15;
  return Math.round(raw);
};

const calcChecklistScore = (text) => {
  const lower = text.toLowerCase();
  return checklistItems.map((item) => {
    let hit = 0;
    switch (item.id) {
      case 'greeting':
        hit = /こんにちは|おはよう|ありがとうございます/.test(lower) ? 1 : 0.4;
        break;
      case 'listening':
        hit = /聞かせて|教えて|お話|伺い|なるほど/.test(lower) ? 1 : 0.5;
        break;
      case 'checking':
        hit = /確認|大丈夫|どうですか|いいですか/.test(lower) ? 1 : 0.45;
        break;
      case 'explaining':
        hit = /説明|提案|共有|お伝え/.test(lower) ? 1 : 0.5;
        break;
      case 'closing':
        hit = /よろしく|楽しみに|お願いいたします|また/.test(lower) ? 1 : 0.35;
        break;
      default:
        hit = 0.5;
    }
    return {
      ...item,
      achieved: hit,
      points: Math.round(hit * item.weight * 100)
    };
  });
};

const scoreMessage = (message) => {
  const vectorScore = calcVectorScore(message.text);
  const checklist = calcChecklistScore(message.text);
  const checklistScore = checklist.reduce((sum, item) => sum + item.points, 0);
  const total = Math.round((vectorScore * 0.6 + checklistScore * 0.4) * 0.01 * 100);

  return {
    messageId: message.id,
    vectorScore,
    checklistScore,
    total,
    checklist
  };
};

const summarizeScores = (scores) => {
  if (!scores.length) {
    return {
      averageVector: 0,
      averageChecklist: 0,
      averageTotal: 0
    };
  }
  const totals = scores.reduce(
    (acc, score) => {
      acc.vector += score.vectorScore;
      acc.checklist += score.checklistScore;
      acc.total += score.total;
      return acc;
    },
    { vector: 0, checklist: 0, total: 0 }
  );

  const count = scores.length;

  return {
    averageVector: Math.round((totals.vector / count) * 10) / 10,
    averageChecklist: Math.round((totals.checklist / count) * 10) / 10,
    averageTotal: Math.round((totals.total / count) * 10) / 10
  };
};

const scoringMock = {
  score: scoreMessage,
  summarize: summarizeScores,
  checklistItems
};

export default scoringMock;
