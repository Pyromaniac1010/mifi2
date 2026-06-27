import { convert, money } from './currency';

export const PERSONALITIES = {
  genZ: { name: 'Gen Z Friend', emoji: '😎', color: 'from-purple-600 to-pink-600' },
  coolUncle: { name: 'Cool Uncle', emoji: '🤙', color: 'from-blue-600 to-cyan-600' },
  harsh: { name: 'Harsh Coach', emoji: '💪', color: 'from-red-600 to-orange-600' },
  professional: { name: 'Professional Advisor', emoji: '💼', color: 'from-gray-700 to-gray-900' },
};

export function getMiInsight(income, expenses, debts, personality, base, rates, strategy) {
  const fmt = (n) => money(n, base, 0);
  const first = strategy === 'snowball' ? 'smallest balance first' : 'highest interest first';
  const totalDebt = debts.reduce((s, d) => s + convert(d.principal, d.currency || base, base, rates), 0);

  if (expenses > income) {
    return {
      genZ: "Bestie… we need to talk about these expenses 😬 You're spending more than you're making and that's giving broke-era vibes. Let's fix this ASAP!",
      coolUncle: "Hey kiddo, slight problem — you're spending more than you're earning this month. Let's chat about getting that back on track, yeah?",
      harsh: 'You\'re BLEEDING money! Expenses exceed income. This is exactly why you\'re not winning. FIX. THIS. NOW. 🔥',
      professional: 'Alert: current expenditure exceeds income. Immediate budget review is recommended to prevent financial deterioration.',
    }[personality];
  }

  if (income > 0 && totalDebt > income * 3) {
    return {
      genZ: `Your debt is lowkey wild rn (${fmt(totalDebt)}) 😳 But don't stress — we've got a plan. Tackle the ${first} and you'll be debt-free before you know it! 💪`,
      coolUncle: `That debt load is looking a bit heavy, champ (${fmt(totalDebt)}). But hey, we've seen worse! Let's make a solid plan to knock it down. You've got this. 🎯`,
      harsh: `${fmt(totalDebt)} in debt?! UNACCEPTABLE! Every day you wait is money down the drain. Attack it NOW. 💪🔥`,
      professional: `Debt-to-income analysis indicates an elevated risk level (${fmt(totalDebt)} outstanding). An aggressive debt-reduction protocol is advised.`,
    }[personality];
  }

  return {
    genZ: 'Looking pretty solid this month! Keep it up, bestie 💸 Your income is covering your obligations — stay consistent and keep that cushion growing. ✨',
    coolUncle: "Nice work this month, kiddo! You're making good moves. Keep it up — and don't forget to treat yourself occasionally. Balance matters. 🌟",
    harsh: "Not terrible, but don't get comfortable. You should be doing BETTER. Push harder, earn more, waste less. MAXIMIZE EVERYTHING! 💪",
    professional: 'Current financial metrics are within acceptable parameters. Continue the disciplined approach and look for optimization opportunities.',
  }[personality];
}

export function generateMiResponse(question, data, personality, base, rates, strategy) {
  const { totalIncome, totalExpenses, debts } = data;
  const fmt = (n) => money(n, base, 0);
  const first = strategy === 'snowball' ? 'smallest balance first' : 'highest interest first';
  const method = strategy === 'snowball'
    ? 'snowball method (smallest balance first)'
    : 'avalanche method (highest interest first)';
  const netBalance = totalIncome - totalExpenses;
  const totalDebt = debts.reduce((s, d) => s + convert(d.principal, d.currency || base, base, rates), 0);
  const debtPayment = debts.reduce((s, d) => s + convert(d.monthlyPayment, d.currency || base, base, rates), 0);
  const obligations = totalExpenses + debtPayment;
  const solvency = obligations > 0 ? (totalIncome / obligations) * 100 : 0;
  const q = question.toLowerCase();

  if (q.includes('how am i doing') || (q.includes('financ') && q.includes('status')) || q.includes('how are my')) {
    if (netBalance >= 0) {
      return {
        genZ: `Okay so like… you're actually doing pretty good rn! 💸 You're making ${fmt(totalIncome)} and spending ${fmt(totalExpenses)}, so you're up by ${fmt(netBalance)}. That's lowkey fire ngl. Your income covers about ${solvency.toFixed(0)}% of your obligations this month — keep that cushion healthy. 📈`,
        coolUncle: `Hey kiddo! Not bad at all. You're bringing in ${fmt(totalIncome)} and keeping expenses at ${fmt(totalExpenses)} — a ${fmt(netBalance)} surplus. Proud of you! 🎉 Your income's covering about ${solvency.toFixed(0)}% of your obligations. Keep it steady.`,
        harsh: `Finally, something decent. You're ${fmt(netBalance)} positive. Don't get comfortable though — income covers ${solvency.toFixed(0)}% of your obligations. Hold it at 100%+ and stack a buffer. 💪🔥`,
        professional: `You're operating with a surplus of ${fmt(netBalance)} this month (income ${fmt(totalIncome)}, expenses ${fmt(totalExpenses)}). Income covers ${solvency.toFixed(1)}% of obligations. Maintain the surplus and direct it toward reserves and goals.`,
      }[personality];
    }
    return {
      genZ: `Oof bestie… not gonna sugarcoat it 😬 You're spending ${fmt(Math.abs(netBalance))} more than you're making. That's broke-era energy and we need to fix it ASAP. Trim some expenses or stack more income. You got this! 💪`,
      coolUncle: `Alright, real talk, champ — you're in the red by ${fmt(Math.abs(netBalance))} this month. Not sustainable, but fixable. Tighten the belt a little and maybe pick up a side gig. Broke is temporary; good habits last. Let's turn it around!`,
      harsh: `Are you SERIOUS right now?! You're BLEEDING ${fmt(Math.abs(netBalance))} this month! Cut the excuses, cut the expenses, and get it together. Every wasted dollar could've been working for you. DO BETTER. 😤`,
      professional: `Your current trajectory is unsustainable — a deficit of ${fmt(Math.abs(netBalance))}. Immediate actions: (1) audit and reduce expenses, (2) diversify income, (3) establish an emergency buffer. Disciplined correction is required.`,
    }[personality];
  }

  if (q.includes('debt') || q.includes('saving')) {
    if (totalDebt > 0) {
      return {
        genZ: `So you've got ${fmt(totalDebt)} in debt… honestly? Kill that first, bestie 🎯 High-interest debt is literally stealing your future bag. Use the ${method} — pay minimums on the rest and attack one like your life depends on it. Then we stack savings. Trust the process 💯`,
        coolUncle: `Here's the wisdom I wish someone gave me younger, kiddo: that ${fmt(totalDebt)} is working against you every day. Crush it using the ${method}. Savings matter, but debt's the emergency. Kill it, then build wealth. 🙌`,
        harsh: `Why is this even a question?! ${fmt(totalDebt)} in DEBT! Forget savings — ATTACK that debt like your freedom depends on it, because it does. ${strategy === 'snowball' ? 'Smallest balance first' : 'Highest interest first'}. No excuses. Execute. 💪🔥`,
        professional: `You're carrying ${fmt(totalDebt)} in debt. Prioritize elimination via the ${method} while maintaining minimums elsewhere. Compound interest works against you in debt and for you in investments — clear the liability first.`,
      }[personality];
    }
    return {
      genZ: `Yooo you're debt-free?! That's goated 🔥 Now build that emergency fund (3–6 months of expenses), then start investing in stuff that pays you while you sleep — index funds, dividends, maybe that side business. Let's get this bread 💰`,
      coolUncle: `No debt? That's what I like to see! 🎉 You're ahead of most people. Build a 3–6 month safety net, then invest steadily. Consistency beats timing — even small amounts compound. Proud of you, champ!`,
      harsh: `No debt? Good. Now STOP sitting on cash — build a 6-month buffer, then invest aggressively. Idle money loses to inflation. Index funds, dividends, real estate. Make your money WORK. 📈`,
      professional: `Debt-free status confirmed — an excellent position. Next: (1) establish a 3–6 month emergency fund, (2) maximize tax-advantaged retirement accounts, (3) build a diversified index portfolio. Time in market beats timing the market.`,
    }[personality];
  }

  if (q.includes('passive') || q.includes('side hustle') || q.includes('side income')) {
    return {
      genZ: `Passive income? Now we're talking 🚀 Start where you are: skills → freelance on Fiverr/Upwork, then systematize. Or build digital products — courses, templates, ebooks. Content on YouTube/TikTok that pays forever. Dividend stocks too. The goal: money while you're at brunch 💸`,
      coolUncle: `The golden question, kiddo! Passive income buys back your time. Start with what you know — turn a skill into a course or product. Got some cash? Dividend payers. Feeling bold? Real-estate crowdfunding. Start small, learn, scale. 🏗️`,
      harsh: `FINALLY thinking like a winner 💪 Stop trading hours for dollars. Skills? Monetize them — courses, consulting, products. Money? Invest it — dividends, index funds, REITs. Time? Build assets — a channel, an app, a SaaS. "I don't know how" isn't an excuse. LEARN. MOVE. 🔥`,
      professional: `Passive-income options, ranked by accessibility: (1) dividend-growth investing — stable and predictable; (2) digital products — leverages existing expertise; (3) REITs — diversification; (4) automated online businesses — higher risk/return. Allocate 20–30% of monthly surplus; compounding becomes significant at the 24–36 month mark.`,
    }[personality];
  }

  return {
    genZ: "Hmm didn't quite catch that, bestie! Ask me about your finances, debt strategy, or how to stack passive income. I'm here to help you secure the bag 💰✨",
    coolUncle: "Not quite sure what you're after, champ. Hit me with questions about your money, debt plans, or building wealth. Uncle Mi's got you 🤙",
    harsh: 'Be specific! Ask me about your finances, your debt, your income strategy. Stop wasting time with vague questions and GET TO THE POINT. 💪',
    professional: "I'm not certain I understood. Try asking about your financial status, debt strategy, expense optimization, or passive-income development.",
  }[personality];
}
