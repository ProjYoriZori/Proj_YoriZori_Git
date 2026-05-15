export function calculateDRI(profile) {
  if (!profile?.age || !profile?.height || !profile?.weight) {
    return { calories: 2000, carbs: 275, protein: 55, fat: 55, sodium: 2000 };
  }

  const isMale = profile.gender === '남성' || profile.gender === 'MALE';
  const bmr = isMale
    ? 88.362 + 13.397 * profile.weight + 4.799 * profile.height - 5.677 * profile.age
    : 447.593 + 9.247 * profile.weight + 3.098 * profile.height - 4.33 * profile.age;

  const activityMultiplier = {
    낮음: 1.2,
    LOW: 1.2,
    보통: 1.55,
    NORMAL: 1.55,
    높음: 1.725,
    HIGH: 1.725,
  }[profile.activityLevel || profile.activity_level] || 1.55;

  const goal = profile.goal || profile.goalType || profile.goal_type;
  let calories = bmr * activityMultiplier;
  if (goal === '다이어트' || goal === 'DIET') calories -= 300;
  if (goal === '벌크업' || goal === 'BULK') calories += 300;

  const roundedCalories = Math.max(1200, Math.round(calories));
  return {
    calories: roundedCalories,
    carbs: Math.round((roundedCalories * 0.55) / 4),
    protein: Math.round((roundedCalories * 0.2) / 4),
    fat: Math.round((roundedCalories * 0.25) / 9),
    sodium: 2000,
  };
}

export function emptyNutrition() {
  return { calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 };
}

export function sumNutrition(logs) {
  return logs.reduce((acc, log) => {
    const serving = Number(log.servingCount || log.serving_count || 1);
    return {
      calories: acc.calories + Number(log.calories || 0) * serving,
      carbs: acc.carbs + Number(log.carbs || 0) * serving,
      protein: acc.protein + Number(log.protein || 0) * serving,
      fat: acc.fat + Number(log.fat || 0) * serving,
      sodium: acc.sodium + Number(log.sodium || 0) * serving,
    };
  }, emptyNutrition());
}

export function progress(current, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function dateKey(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatKoreanDate(date) {
  const today = dateKey(new Date());
  const yesterday = dateKey(addDays(new Date(), -1));
  const selected = dateKey(date);
  if (selected === today) return '오늘';
  if (selected === yesterday) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
