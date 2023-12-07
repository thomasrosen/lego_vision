import 'dotenv/config';
import fs from 'fs';
import mime from 'mime-types';
import OpenAI from 'openai';

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

async function main() {
  let imagepath = undefined
  let additional_info = undefined

  // imagepath = './images/stmm-lego2.jpg';
  // additional_info = 'Im Bild werden Lego Packete an das Krankenhauspersonal übergeben. Die Lego Packete sind für die Kinder im Krankenhaus. Die Personen im weißen Tshirt sind keine Ärzte, sondern die Spender! DIE LEGO PACKETE SIND WICHTIG.'

  // imagepath = './images/fam_xmas.jpg';
  // additional_info = 'There is a xmas-tree in the background. The foreground is a family. Son is 26. Parents are around 60. The father has his hand around the mother. The mother is in the middle. Make it look like a selfie.'

  // imagepath = './images/stefan_strand.jpg';
  // additional_info = 'The man is wearing a cap.'

  // imagepath = './images/uta_und_stefan_zoomed.jpg';
  // additional_info = 'MAKE IT LOOK LIKE A SELFIE!'

  // imagepath = './images/thomas_MAX_0854.jpg';
  // additional_info = 'The person is 26 years old. THE PERSON HAS NO BEARD. He looks straight into the camera. The background is blurred. He is happy.'

  // imagepath = './images/IMG_1404.jpg';
  // additional_info = 'The person is 26 years old. THE PERSON HAS NO BEARD. The background is blurred. He is happy. Wide angle shot from below. 45 degree angle.'

  // imagepath = './images/IMG_1207.jpg';
  // additional_info = 'Two guys kissing. The people are in their twenties. They wear purple clothing. The left person has brown hair with a dark green cap. The right person has blond hair. Dont print text.'

  // imagepath = './images/sam_2c22d11c-15f9-4410-92aa-067f903e3fe0.JPG';
  // additional_info = 'There are four people in this group shot. Be precise. One boy is on his phone. The others are looking into the camera.'

  // imagepath = './images/sam_b6f37d9d-4117-4fa0-88ee-db50a571b8da.JPG';
  // additional_info = 'make this a wide angle shot. the scarf needs to look like LEGO. Include the wall, ther person is leaning on. IT MUST LOOK LIKE A SCENE FROM THE LEEGO MOVIE.'

  // imagepath = './images/IMG_1302.jpeg';
  // additional_info = 'It is IMPORTANT that the person is sitting in the corner. The person looks a bit shocked but very cute.'

  imagepath = './IMG_1305.jpg';
  additional_info = 'The person is sad, cause it is cold in Berlin.'

  imagepath = './images/IMG_1367.jpg';
  additional_info = 'The photo is in black in white. The lego photo should also be in black and white. The neckless and hairstyle are important.'

  const datauriOfTheImage = await readImageAndConvertToBase64(imagepath);

  // const datauriOfTheImage = 'https://pbs.twimg.com/profile_images/1649014378425982977/AgEzfZjB_400x400.jpg';
  // additional_info = 'The age of the person is 26 years.'

  const prompt = await genLegoPrompt({
    image_url: datauriOfTheImage,
    additional_info,
  });
  console.log('\n', prompt)

  // const prompt = 'Create an image in the style of a LEGO character from \"The LEGO Movie\", representing a young adult male with fair skin and light brown/blondish hair, smiling contentedly with his eyes gently closed. He should be dressed in a horizontally striped light and dark grey t-shirt. The LEGO character is holding a slice of watermelon to his mouth, appearing to take a bite with juice visible on the lips of the LEGO figure. The setting is outdoors, with a blurred natural green backdrop suggestive of foliage. The image should be rendered with vibrant colors and crisp plastic textures characteristic of LEGO, at a high resolution to capture the intricate details of the LEGO world.'
  const imageURL = await genImage({ prompt });
  console.log('\n', imageURL, '\n');
}
main();
