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

// 型エラー: numberにstring代入
export const brokenTypes = (): number => {
  const x: number = 'hello'
  return x
}

// 未使用変数
export const unusedVars = () => {
  const a = 1
  const b = 2
  const c = 3
  return a
}
