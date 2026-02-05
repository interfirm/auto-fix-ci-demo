export const calculateTotal = (items: { price: number; quantity: number }[]) => {
  // This will fail because the function returns string concatenation instead of number
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return String(total)
}

export const complexFunction = () => {
  return {
    a: 1,
    b: 2,
  }
}

export const iReturnVoid = (): void => {
  console.log('hello')
}

export const getUserName = (user: { name?: string }) => {
  // This will throw runtime error
  return user.name?.toUpperCase()
}

export const brokenApiCall = async (data: any) => {
  const result = await fetch('https://google.com', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return await result.json().then((d: any) => d)
}
