// api/books/catalog.js - يجيب الكتب من al-amgaad.com
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const response = await fetch('https://www.al-amgaad.com/2021/08/allbooks.html')
    const html = await response.text()

    // استخراج روابط الكتب - طريقة بسيطة
    const books = []
    const regex = /href="([^"]+\.pdf)"[^>]*>([^<]+)/g
    let match
    let id = 1
    while ((match = regex.exec(html))!== null && books.length < 100) {
      const url = match[1].startsWith('http')? match[1] : `https://www.al-amgaad.com${match[1]}`
      const title = match[2].trim()
      if (title.length > 3) {
        books.push({
          id: `book_${id++}`,
          title,
          url,
          subject: title.includes('رياض')? 'رياضيات' : title.includes('فيزيا')? 'فيزياء' : 'عام',
          grade: 'ثالث ثانوي',
        })
      }
    }

    // لو ما لقاش، رجع قائمة تجريبية باش ما يوقفش الموقع
    if (books.length === 0) {
      books.push(
        { id: 'demo_1', title: 'الرياضيات - ثالث ثانوي علمي', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', subject: 'رياضيات', grade: 'ثالث ثانوي' },
        { id: 'demo_2', title: 'الفيزياء - الميكانيكا', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', subject: 'فيزياء', grade: 'ثالث ثانوي' },
        { id: 'demo_3', title: 'الكيمياء العضوية', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', subject: 'كيمياء', grade: 'ثالث ثانوي' },
      )
    }

    return res.json({ books })
  } catch (e) {
    return res.json({
      books: [
        { id: 'demo_1', title: 'الرياضيات - ثالث ثانوي علمي', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', subject: 'رياضيات', grade: 'ثالث ثانوي' },
        { id: 'demo_2', title: 'الفيزياء - الميكانيكا', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', subject: 'فيزياء', grade: 'ثالث ثانوي' },
      ]
    })
  }
}