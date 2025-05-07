// pages/index.js
import { useState, useEffect } from 'react'
import { checkAttendance } from '../lib/api'

export default function Home() {
  const [scannerConnected, setScannerConnected] = useState(false)
  const [qr, setQr] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [hidSupported, setHidSupported] = useState(false)
  const [browserInfo, setBrowserInfo] = useState('')
  const [hidDevice, setHidDevice] = useState(null)

  // 브라우저 정보 확인
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('edg')) {
      return 'Microsoft Edge'
    } else if (userAgent.includes('chrome')) {
      return 'Chrome'
    } else {
      return '기타 브라우저'
    }
  }

  // WebHID로 바코드 스캐너 연결 상태 확인
  const checkHIDConnection = async () => {
    if (!('hid' in navigator)) return
    const devices = await navigator.hid.getDevices()
    // 실제 productName, vendorId, productId 등으로 필터 가능
    const found = devices.find(
      d => d.productName?.toLowerCase().includes('bar code scanner')
    )
    setScannerConnected(!!found)
    setHidDevice(found || null)
  }

  // HID 장치 연결 시도 (팝업)
  const connectHIDDevice = async () => {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [
          // 필요시 vendorId, productId 등으로 필터 추가
        ],
      })
      if (devices && devices.length > 0) {
        setScannerConnected(true)
        setHidDevice(devices[0])
        setMessage('HID 장치가 연결되었습니다.')
      }
    } catch (error) {
      setMessage('HID 장치 연결에 실패했습니다.')
    }
  }

  useEffect(() => {
    setBrowserInfo(getBrowserInfo())
    const isHidSupported = navigator && 'hid' in navigator
    setHidSupported(isHidSupported)
    if (isHidSupported) {
      checkHIDConnection()
      const handleConnect = () => {
        checkHIDConnection()
        setMessage('HID 장치가 연결되었습니다.')
      }
      const handleDisconnect = () => {
        checkHIDConnection()
        setMessage('HID 장치가 연결 해제되었습니다.')
      }
      navigator.hid.addEventListener('connect', handleConnect)
      navigator.hid.addEventListener('disconnect', handleDisconnect)
      return () => {
        navigator.hid.removeEventListener('connect', handleConnect)
        navigator.hid.removeEventListener('disconnect', handleDisconnect)
      }
    }
  }, [browserInfo])

  // QR 코드 유효성 검사
  const isValidQRCode = code =>
    code && code.length > 0 && /^[a-zA-Z0-9-_]+$/.test(code)

  // 실제 체크인 호출
  const doCheckIn = async code => {
    if (!isValidQRCode(code)) {
      setMessage('유효하지 않은 QR 코드입니다.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const data = await checkAttendance(code)
      setMessage(`${data.name} 님 출석 완료!`)
      setQr('')
    } catch (err) {
      let errorMessage = '체크인 실패'
      if (err?.response?.status === 404) {
        errorMessage = '등록되지 않은 QR 코드입니다.'
      } else if (err?.response?.status === 400) {
        errorMessage = '이미 체크인된 QR 코드입니다.'
      } else if (err?.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      } else if (!navigator.onLine) {
        errorMessage = '인터넷 연결을 확인해주세요.'
      }
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      doCheckIn(qr.trim())
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-2">QR 체크인 데모</h1>
      <p className="text-sm text-gray-600 mb-2">
        현재 브라우저: {browserInfo}
      </p>
      {hidSupported ? (
        <div className="mb-4">
          <p className={`${scannerConnected ? 'text-green-600' : 'text-red-600'}`}>
            {scannerConnected ? '리더기 연결됨 ✅' : '리더기 미연결 ❌'}
          </p>
          {!scannerConnected && (
            <button
              onClick={connectHIDDevice}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              HID 장치 연결하기
            </button>
          )}
        </div>
      ) : (
        <p className="text-yellow-600 mb-4">
          이 브라우저는 Web HID를 지원하지 않습니다.
        </p>
      )}
      <form
        onSubmit={e => {
          e.preventDefault()
          doCheckIn(qr.trim())
        }}
        className="flex flex-col items-center"
      >
        <input
          type="text"
          value={qr}
          onChange={e => setQr(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="QR 코드 또는 링크"
          className="border rounded p-2 w-80 mb-2"
          disabled={loading}
          required
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? '체크인 중...' : '체크인'}
        </button>
      </form>
      {message && (
        <p className="mt-4 text-lg" role="alert" aria-live="polite">
          {message}
        </p>
      )}
      <p className="mt-2 text-sm text-gray-500">
        * 페이지가 활성화된 상태에서 스캐너로 찍으면 자동 체크인됩니다.
      </p>
    </div>
  )
}
