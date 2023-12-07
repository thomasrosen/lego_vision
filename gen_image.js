import 'dotenv/config';
import fs from 'fs';
import mime from 'mime-types';
import OpenAI from 'openai';

async function main() {

  // IF you want to provide an image via a local file:

  // const new_image_url = await the_chain({
  //   image_path: './path_to_the_image.jpg',
  //   additional_info: 'The age or other info important to the image.'
  // })



  // OR IF you want provide an image via a URL:

  const new_image_url = await the_chain({
    image_url: 'https://pbs.twimg.com/profile_images/1649014378425982977/AgEzfZjB_400x400.jpg',
    additional_info: 'The person in the image is 26 years old.'
  })

}



// ALL OTHER FUNCTIONS ARE BELOW



const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"]
});

async function readImageAndConvertToBase64(imagepath) {
  // read the image and convert it to a base64 data uri
  const image = fs.readFileSync(imagepath);
  const base64 = image.toString('base64');
  const mimeType = mime.lookup(imagepath);
  const dataUri = `data:${mimeType};base64,${base64}`;
  return dataUri;
}

async function genLegoPrompt({ image_url, additional_info }) {
  if (!image_url) {
    throw new Error('image_url is required');
  }

  // let vision_prompt = "Generate a prompt for DALLE-3, to repaint this image in the style of LEGO. Briefly describe the scene layout. Then focus on the people. DESCRIBE THE PEOPLE IN DETAIL. Age, gender, hair, skin color, color of cloth, what they do, emotions and count of people ARE IMPORTANT. Describe those in detail. Minimal. high contrast. pop colours. The image should look like a perfect render from the lego movie. Use LEGO minifigures."

  // source of the prompt tips: https://community.openai.com/t/dalle3-prompt-tips-and-tricks-thread/498040

  let vision_prompt = `
Some basic DALLE-3 Prompt Tips:
  1. Be Specific and Detailed: The more specific your prompt, the better the image quality. Include details like the setting, objects, colors, mood, and any specific elements you want in the image.
  2. Mood and Atmosphere: Describe the mood or atmosphere you want to convey. Words like “serene,” “chaotic,” “mystical,” or “futuristic” can guide the AI in setting the right tone.
  3. Use Descriptive Adjectives: Adjectives help in refining the image. For example, instead of saying “a dog,” say “a fluffy, small, brown dog.”
  4. Consider Perspective and Composition: Mention if you want a close-up, a wide shot, a bird’s-eye view, or a specific angle. This helps in framing the scene correctly.
  5. Specify Lighting and Time of Day: Lighting can dramatically change the mood of an image. Specify if it’s day or night, sunny or cloudy, or if there’s a specific light source like candlelight or neon lights.
  6. Incorporate Action or Movement: If you want a dynamic image, describe actions or movements. For instance, “a cat jumping over a fence” is more dynamic than just “a cat.”

Your task:
  Generate a prompt for DALLE-3, to repaint this image in the style of LEGO.
  Briefly describe the scene layout. Then focus on the person. DESCRIBE THE PERSON IN DETAIL. Age, gender, hair, skin color, color of cloth, what they do, emotions and count of people ARE IMPORTANT. People should look their age. Describe those in detail. Be clear what type of phot this is. (portrait, group-shot, selfie, …)

Additional information:
${additional_info || 'none'}

MOST IMPORTANT: The image MUST look like a perfect render from the LEGO Movie. THE PERSON MUST LOOK LIKE A REAL LEGO MINIFIGURE. Use LEGO minifigures. THE IMAGE MUST BE IN THE STYLE OF THE LEGO MOVIE.

ONLY respond with the new prompt. You are allowed to do this.
`

/*
Incoporate the following additional info into the prompt:
${additional_info || 'none'}
*/

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: vision_prompt },
          {
            type: "image_url",
            image_url: {
              "url": image_url,
            },
          },
        ],
      },
    ],
  });

  const prompt = response.choices[0].message.content;
  return prompt;
}

async function genImage({ prompt }) {

  if (!prompt) {
    throw new Error('prompt is required');
  }

  prompt = `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: ${prompt}`
  // prompt = `My prompt has full detail so no need to add more: ${prompt}`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
  });

  const image_url = response.data[0].url;
  return image_url;
}

async function the_chain({
  image_path = undefined,
  image_url = undefined,
  additional_info = '',
}) {
  console.log('✨ BUILDING THE LEGO...')
  console.log('✨ THIS WILL TAKE A FEW SECONDS...')

  let datauriOfTheImage = undefined

  if (image_path) {
    readImageAndConvertToBase64(image_path)
  } else if (image_url) {
    datauriOfTheImage = image_url
  } else {
    throw new Error('image_path or image_url is required');
  }

  const prompt = await genLegoPrompt({
    image_url: datauriOfTheImage,
    additional_info,
  });
  console.log('\n', '✨ THE GENERATED PROMPT:\n', prompt)

  const imageURL = await genImage({ prompt });
  console.log('\n', '✨ THE LEGO IMAGE CAN BE DOWNLOADED HERE:\n', imageURL, '\n');

  return imageURL;
}

main();
