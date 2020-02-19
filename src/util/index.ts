export function dateGenerator(date: Date) {
  return (
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "/" +
    ("0" + date.getDate()).slice(-2)
  );
}

export function dateGeneratorFromNumber(month: number, date: number) {
  return ("0" + month).slice(-2) + "/" + ("0" + date).slice(-2);
}

export function indexGenerator(year: number, month: number) {
  return ("0".repeat(4) + year).slice(-4) + ("0" + (month + 1)).slice(-2);
}
