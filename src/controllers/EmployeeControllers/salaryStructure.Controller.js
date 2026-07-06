const structures = await SalaryStructure.find();

for (const s of structures) {
  const exists = await Salary.findOne({
    employee: s.employee,
    month,
    year,
  });

  if (exists) continue;

  await Salary.create({
    employee: s.employee,

    month,
    year,

    effectiveFrom: s.effectiveFrom,

    basic: s.basic,
    hra: s.hra,
    da: s.da,
    specialAllowance: s.specialAllowance,
    bonus: s.bonus,

    pf: s.pf,
    esi: s.esi,
    tax: s.tax,
    otherDeduction: s.otherDeduction,
  });
}