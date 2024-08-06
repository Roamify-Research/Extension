import torch
from transformers import BertForQuestionAnswering
from transformers import BertTokenizer

class BERT_Processer:
    def __init__(self):
        self.tokenizer = BertTokenizer.from_pretrained('bert-large-uncased-whole-word-masking-finetuned-squad')
        self.model = BertForQuestionAnswering.from_pretrained('bert-large-uncased-whole-word-masking-finetuned-squad')
        
    def answer_question(self, question, paragraph):
        encoding = self.tokenizer.encode_plus(text=question, text_pair=paragraph, add_special_tokens=True)
        input_ids = encoding['input_ids']  # Token embeddings
        token_type_ids = encoding['token_type_ids']  # Segment embeddings
        tokens = self.tokenizer.convert_ids_to_tokens(input_ids)  # Input tokens
        
        input_ids = torch.tensor([input_ids])
        token_type_ids = torch.tensor([token_type_ids])

        # Get the start and end scores from the model
        outputs = self.model(input_ids=input_ids, token_type_ids=token_type_ids)
        start_scores = outputs.start_logits
        end_scores = outputs.end_logits
        
        start_index = torch.argmax(start_scores)
        end_index = torch.argmax(end_scores) + 1

        answer = ' '.join(tokens[start_index:end_index+1])
        
        corrected_answer = ''

        for word in answer.split():
            
            #If it's a subword token
            if word[0:2] == '##':
                corrected_answer += word[2:]
            else:
                corrected_answer += ' ' + word
        
        return corrected_answer