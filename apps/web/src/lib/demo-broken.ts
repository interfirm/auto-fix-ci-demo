/**
 * DEMO: This file contains intentional errors for demonstration
 * Remove or fix before production use
 */

// ERROR 1: Unused variable (ESLint error)
const unusedVariable = 'this is not used'

// ERROR 2: Type error - string vs number
export function calculateTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((sum, item) => {
    // Type error: returning string instead of number
    return sum + (item.price * item.quantity).toString()
  }, 0)
}

// ERROR 3: Missing return type annotation (if strict)
export function processData(data) {
  return data.map((d) => d.value * 2)
}

// ERROR 4: Potential runtime error - accessing undefined
export function getUserName(user: { name?: string }): string {
  return user.name.toUpperCase() // name might be undefined!
}
