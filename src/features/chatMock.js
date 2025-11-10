const fallbackResponses = [
  'ありがとうございます。もう少し詳しく教えてもらえますか？',
  'その点についてはどのように感じていますか？',
  '理解しました。次にどう進めたいですか？'
];

const scenarioHints = {
  'classroom-conflict': [
    '状況を整理できました。次は双方の合意について考えてみましょう。',
    '落ち着いて話せるように配慮してくれて助かりました。'
  ],
  'parent-meeting': [
    '保護者としても安心しました。具体的なサポート方法を相談しましょう。',
    '丁寧に共有してくれてありがとうございます。'
  ],
  'inclusion-support': [
    'その説明なら安心できます。次のステップを一緒に考えましょう。',
    '配慮の提案がとても助かります。'
  ]
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chatMock = {
  async reply({ text, scenarioId }) {
    await delay(600 + Math.random() * 600);
    const options = scenarioHints[scenarioId] ?? fallbackResponses;
    const responseText =
      options[Math.floor(Math.random() * options.length)] ?? fallbackResponses[0];

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: responseText,
      timestamp: new Date().toISOString()
    };
  }
};

export default chatMock;
