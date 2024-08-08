import re
from nltk.tokenize import sent_tokenize, word_tokenize
import nltk

nltk.download("punkt")

itenary = """
Here's a detailed 5-day itinerary for your trip to Delhi, covering all the suggested places:

**Day 1: India Gate, Lotus Temple, and Akshardham Temple**

* Morning: Start your day with a visit to **India Gate**, a symbol of Indian soldiers' sacrifice. Spend some time here and take in the beauty of this iconic monument.
* Afternoon: Head to the **Lotus Temple**, a stunning temple with 27 marble-clad "petals" arranged in clusters of three, inspired by the flower. It's a perfect place for history buffs and photography enthusiasts.
* Evening: Visit the **Akshardham Temple**, dedicated to Lord Swaminarayan, and marvel at its intricate architecture. The evening light show is truly breathtaking.

**Day 2: Hauz Khas, Chandni Chowk, and Jama Masjid**

* Morning: Explore the charming complex of **Hauz Khas**, which offers a glimpse into Mughal culture and history. Don't miss the mosque and reservoir, which add to its charm.
* Afternoon: Visit **Chandni Chowk**, a bustling marketplace built by the Mughals in the 17th century. Enjoy the street food, parathas, and local stores selling day-to-day items at reduced prices.
* Evening: Stop by **Jama Masjid**, the largest mosque in India, known for its beautiful architecture and peaceful surroundings.

**Day 3: Lodhi Gardens**

* Morning: Visit **Lodhi Gardens**, a tranquil oasis in the heart of Delhi. This Mughal-era garden is a perfect place to relax and enjoy nature.
* Afternoon: Explore the intricate architecture and layout of the gardens, which date back to the 15th and 16th centuries.

**Day 4: Humayun's Tomb**

* Morning: Visit **Humayun's Tomb**, the first Mughal monument in India. This stunning structure is a testament to Persian architecture.
* Afternoon: Spend some time admiring the intricate details on the walls of this historic monument.

**Day 5: Relax and Departure**

* Take a day off to relax, shop for souvenirs, or visit any last-minute attractions you might have missed. Depart from Delhi, bringing back memories of your incredible journey!

This itinerary provides a good balance of history, culture, and relaxation, allowing you to experience the best of Delhi in just 5 days!
"""

# Use regular expression to find all day headings and their respective content
matches = re.findall(
    r"(\*\*Day [0-9]+:.*?\*\*)\n\n(.*?)(?=\n\n\*\*Day [0-9]+:|\Z)", itenary, re.DOTALL
)

days_dict = {}

# Iterate over matches and store them in the dictionary
for match in matches:
    day_heading = match[0].strip("*")  # Clean the day heading
    content = match[1].strip()
    days_dict[day_heading] = content

# Tokenize and clean the content for each day
itenary_dict = {}
for day, content in days_dict.items():
    itenary_dict[day] = []
    for line in content.split("\n"):
        cleaned_line = line.strip().replace("*", "").strip()
        if cleaned_line:
            itenary_dict[day].append(cleaned_line)

print(itenary_dict)
