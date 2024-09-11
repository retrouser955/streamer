import Innertube from "youtubei.js"
import open from "open"

const exit = (message, clean) => {
    if(clean) {
        console.log(message)
        process.exit(0)
    }

    throw new Error(message)
}

const youtube = await Innertube.create({
    retrieve_player: false
})

youtube.session.on("auth-pending", (data) => {
    const { verification_url: verify, user_code } = data

    open(verify)

    console.log(`Follow this URL: ${verify} and enter this code: ${user_code}\nMake sure you are using a throwaway account to login. Using your main account may result in ban or suspension`)
})

youtube.session.on("auth-error", (err) => {
    exit(err.message, false)
})

youtube.session.on('auth', (data) => {
    if(!data.credentials) exit("Something went wrong", false)
        
    console.log('Your cookies are printed down below')
    console.log(Object.entries(data.credentials).map(([k, v]) => `${k}=${v instanceof Date ? v.toISOString() : v}`).join("; "))
    exit("Done Getting the credentials", true)
})

await youtube.session.signIn()