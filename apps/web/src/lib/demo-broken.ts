export const calculateTotal = (items: { price: number; quantity: number }[]) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return total
}

export const complexFunction = () => {
  return {
    a: 1,
    b: 2,
  }
}

export const getUserName = (user: { name?: string }) => {
  return user.name?.toUpperCase() ?? 'Unknown'
}
