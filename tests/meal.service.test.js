import { describe, expect, it } from "vitest";
import { createTestContext } from "./helpers/testContext.js";

describe("MealService: números no representables en JSON", () => {
  it.each([
    ["calories", NaN], ["calories", Infinity], ["calories", -Infinity],
    ["proteinGrams", NaN], ["proteinGrams", Infinity], ["proteinGrams", -Infinity]
  ])("rechaza %s = %s antes de persistir", async (field, value) => {
    const { userService, mealService, mealRepository } = await createTestContext();
    const user = await userService.register({ email: "numeros@example.com", password: "Usuario1234" });
    const data = { name: "Comida", calories: 0, proteinGrams: 0, mealDate: "2026-11-17" };
    const meal = await mealService.create(user.id, data);

    await expect(mealService.create(user.id, { ...data, [field]: value }))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_MEAL_DATA" });
    await expect(mealService.update(user.id, meal.id, { [field]: value }))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_MEAL_DATA" });
    expect(await mealRepository.findByDate(user.id, data.mealDate)).toEqual([meal]);
  });
});

describe("MealService: validaciones de dominio y aislamiento", () => {
  const baseMeal = {
    name: "Pollo con arroz",
    calories: 550,
    proteinGrams: 42.5,
    mealDate: "2026-11-17"
  };

  it("recorta espacios del nombre al crear y actualizar", async () => {
    const { userService, mealService } = await createTestContext();
    const user = await userService.register({ email: "trim@example.com", password: "Usuario1234" });

    const created = await mealService.create(user.id, { ...baseMeal, name: "  Pollo con arroz  " });
    expect(created.name).toBe("Pollo con arroz");

    const updated = await mealService.update(user.id, created.id, { name: "  Cena ligera  " });
    expect(updated.name).toBe("Cena ligera");
  });

  it.each([
    ["nombre solo espacios", { ...baseMeal, name: "   " }],
    ["nombre mayor de 100 caracteres", { ...baseMeal, name: "a".repeat(101) }],
    ["calorías negativas", { ...baseMeal, calories: -10 }],
    ["calorías decimales", { ...baseMeal, calories: 120.5 }],
    ["proteínas negativas", { ...baseMeal, proteinGrams: -1 }],
    ["proteínas con más de 2 decimales", { ...baseMeal, proteinGrams: 12.345 }],
    ["fecha inexistente", { ...baseMeal, mealDate: "2026-02-29" }],
    ["formato de fecha inválido", { ...baseMeal, mealDate: "17-11-2026" }],
    ["campo desconocido", { ...baseMeal, extra: true }],
    ["campos obligatorios incompletos", { name: "Solo nombre" }]
  ])("rechaza en create: %s", async (_label, payload) => {
    const { userService, mealService } = await createTestContext();
    const user = await userService.register({ email: "valid@example.com", password: "Usuario1234" });

    await expect(mealService.create(user.id, payload))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_MEAL_DATA" });
  });

  it("rechaza fechas inválidas en listByDate y actualizaciones vacías o con UUID inválido", async () => {
    const { userService, mealService } = await createTestContext();
    const user = await userService.register({ email: "ids@example.com", password: "Usuario1234" });
    const meal = await mealService.create(user.id, baseMeal);

    await expect(mealService.listByDate(user.id, "2026-02-29"))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_MEAL_DATA" });
    await expect(mealService.update(user.id, meal.id, {}))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_MEAL_DATA" });
    await expect(mealService.update(user.id, "no-es-uuid", { calories: 400 }))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_MEAL_DATA" });
    await expect(mealService.delete(user.id, "no-es-uuid"))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_MEAL_DATA" });
  });

  it("impide modificar o borrar comidas de otro usuario o inexistentes (404)", async () => {
    const { userService, mealService } = await createTestContext();
    const owner = await userService.register({ email: "owner@example.com", password: "Usuario1234" });
    const other = await userService.register({ email: "other@example.com", password: "Usuario1234" });
    const meal = await mealService.create(owner.id, baseMeal);

    await expect(mealService.update(other.id, meal.id, { calories: 100 }))
      .rejects.toMatchObject({ statusCode: 404, code: "MEAL_NOT_FOUND" });
    await expect(mealService.delete(other.id, meal.id))
      .rejects.toMatchObject({ statusCode: 404, code: "MEAL_NOT_FOUND" });
    await expect(mealService.delete(owner.id, "00000000-0000-4000-8000-000000000000"))
      .rejects.toMatchObject({ statusCode: 404, code: "MEAL_NOT_FOUND" });

    expect(await mealService.listByDate(owner.id, baseMeal.mealDate)).toEqual([meal]);
  });
});
