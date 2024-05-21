from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from bs4 import BeautifulSoup
import csv
import os

# Path to the Edge WebDriver executable
PATH = r"C:\Users\harsh\Downloads\edgedriver_win64 (1)\msedgedriver.exe"

# Create an instance of Edge Options
edge_options = Options()

# Initialize the Edge WebDriver with the correct service and options
service = Service(PATH)
driver = webdriver.Edge(service=service, options=edge_options)

# URL to scrape
base_url = "http://quotes.toscrape.com/"
driver.get(base_url)

data_list = []

while True:
    html = driver.page_source
    soup = BeautifulSoup(html, 'html.parser')
    quotes = soup.find_all('div', class_='quote')

    if not quotes:
        print("No quotes found on the current page. Exiting the loop.")
        break

    for quote in quotes:
        description = quote.find('span', class_='text').get_text()
        author = quote.find('small', class_='author').get_text()
        tags = quote.find_all('a', class_='tag')
        tag_list = [tag.get_text() for tag in tags]
        data_list.append([author, description, ', '.join(tag_list)])
        print(f'Added quote: {description} by {author}')

    next_link = soup.find('li', class_='next')

    if next_link:
        next_page_url = next_link.find('a')['href']
        if not next_page_url.startswith('http'):
            next_page_url = base_url + next_page_url
        driver.get(next_page_url)
    else:
        print("No 'Next' link found. Exiting the loop.")
        break

# Close the driver
driver.quit()

# Define the directory to save the CSV file
directory = 'D:\\Projects\\WebScraper'
os.makedirs(directory, exist_ok=True)  # Create directory if it doesn't exist
csv_file = os.path.join(directory, 'quotes_data.csv')

# Write data to CSV file
with open(csv_file, 'w', newline='', encoding='utf-8') as csvfile:
    csv_writer = csv.writer(csvfile)
    csv_writer.writerow(['Author', 'Quote', 'Tags'])
    for item in data_list:
        csv_writer.writerow([item[0], item[1], item[2]])

print(f'Data has been successfully written to {csv_file}')
