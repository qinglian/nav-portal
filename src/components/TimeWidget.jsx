import { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'
import styles from './TimeWidget.module.css'

export default function TimeWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekDay = weekDays[date.getDay()]
    return `${year}年${month}月${day}日 ${weekDay}`
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })
  }

  const getGreeting = () => {
    const hour = time.getHours()
    if (hour < 6) return '夜深了，注意休息'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了，注意休息'
  }

  return (
    <div className={styles.widget}>
      <div className={styles.left}>
        <span className={styles.greeting}>{getGreeting()}</span>
        <div className={styles.date}>
          <Calendar size={13} />
          <span>{formatDate(time)}</span>
        </div>
      </div>
      <div className={styles.time}>
        <Clock size={14} />
        <span>{formatTime(time)}</span>
      </div>
    </div>
  )
}
