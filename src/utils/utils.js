export function getDayOfWeek(day) {
    const dayOfWeekMap = ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return dayOfWeekMap[day];
  }
  
  export function getCoursesByDay(schedules, dayOfWeek) {
 
    if (!Array.isArray(schedules)) {
      console.error('Schedules is not an array');
      return [];
    }
  
    return schedules
      .filter(course => course.dayofweek === dayOfWeek)
      .sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }
  
  export function parseTime(timeString) {
    const [startTime] = timeString.split("-");
    const [hour, minute] = startTime.split(":").map(Number);
    return hour * 60 + minute;
  }
  