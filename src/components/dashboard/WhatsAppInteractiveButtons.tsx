import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ListOrdered, Reply, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuickReplyButton {
  id: string;
  title: string;
}

interface ListRow {
  id: string;
  title: string;
  description?: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

interface WhatsAppInteractiveButtonsProps {
  onSend: (message: InteractiveMessage) => void;
  disabled?: boolean;
}

export interface InteractiveMessage {
  type: 'quick_reply' | 'list';
  header?: string;
  body: string;
  footer?: string;
  buttons?: QuickReplyButton[];
  listButtonText?: string;
  sections?: ListSection[];
}

export const WhatsAppInteractiveButtons = ({ onSend, disabled }: WhatsAppInteractiveButtonsProps) => {
  const [activeTab, setActiveTab] = useState<'quick_reply' | 'list'>('quick_reply');
  
  // Quick Reply state
  const [quickReplyBody, setQuickReplyBody] = useState('');
  const [quickReplyButtons, setQuickReplyButtons] = useState<QuickReplyButton[]>([
    { id: 'btn-1', title: '' }
  ]);

  // List Message state
  const [listBody, setListBody] = useState('');
  const [listButtonText, setListButtonText] = useState('View Options');
  const [listSections, setListSections] = useState<ListSection[]>([
    { title: 'Options', rows: [{ id: 'row-1', title: '', description: '' }] }
  ]);

  const addQuickReplyButton = () => {
    if (quickReplyButtons.length < 3) {
      setQuickReplyButtons([
        ...quickReplyButtons,
        { id: `btn-${Date.now()}`, title: '' }
      ]);
    }
  };

  const removeQuickReplyButton = (index: number) => {
    if (quickReplyButtons.length > 1) {
      setQuickReplyButtons(quickReplyButtons.filter((_, i) => i !== index));
    }
  };

  const updateQuickReplyButton = (index: number, title: string) => {
    const updated = [...quickReplyButtons];
    updated[index] = { ...updated[index], title: title.substring(0, 20) };
    setQuickReplyButtons(updated);
  };

  const addListRow = (sectionIndex: number) => {
    if (listSections[sectionIndex].rows.length < 10) {
      const updated = [...listSections];
      updated[sectionIndex].rows.push({
        id: `row-${Date.now()}`,
        title: '',
        description: ''
      });
      setListSections(updated);
    }
  };

  const removeListRow = (sectionIndex: number, rowIndex: number) => {
    if (listSections[sectionIndex].rows.length > 1) {
      const updated = [...listSections];
      updated[sectionIndex].rows = updated[sectionIndex].rows.filter((_, i) => i !== rowIndex);
      setListSections(updated);
    }
  };

  const updateListRow = (sectionIndex: number, rowIndex: number, field: 'title' | 'description', value: string) => {
    const updated = [...listSections];
    updated[sectionIndex].rows[rowIndex] = {
      ...updated[sectionIndex].rows[rowIndex],
      [field]: field === 'title' ? value.substring(0, 24) : value.substring(0, 72)
    };
    setListSections(updated);
  };

  const handleSendQuickReply = () => {
    if (!quickReplyBody.trim() || quickReplyButtons.some(b => !b.title.trim())) return;
    
    onSend({
      type: 'quick_reply',
      body: quickReplyBody,
      buttons: quickReplyButtons
    });

    // Reset form
    setQuickReplyBody('');
    setQuickReplyButtons([{ id: 'btn-1', title: '' }]);
  };

  const handleSendList = () => {
    if (!listBody.trim() || !listButtonText.trim()) return;
    if (listSections.some(s => s.rows.some(r => !r.title.trim()))) return;
    
    onSend({
      type: 'list',
      body: listBody,
      listButtonText,
      sections: listSections
    });

    // Reset form
    setListBody('');
    setListButtonText('View Options');
    setListSections([{ title: 'Options', rows: [{ id: 'row-1', title: '', description: '' }] }]);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Reply className="w-4 h-4" />
          Interactive Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick_reply' | 'list')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="quick_reply" className="text-xs">
              <Reply className="w-3 h-3 mr-1" />
              Quick Reply
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs">
              <ListOrdered className="w-3 h-3 mr-1" />
              List Menu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick_reply" className="space-y-4">
            <div>
              <Label className="text-xs">Message Body</Label>
              <Textarea
                value={quickReplyBody}
                onChange={(e) => setQuickReplyBody(e.target.value)}
                placeholder="Enter your message..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Quick Reply Buttons (max 3)</Label>
                <Badge variant="secondary" className="text-xs">
                  {quickReplyButtons.length}/3
                </Badge>
              </div>
              <div className="space-y-2">
                {quickReplyButtons.map((button, index) => (
                  <div key={button.id} className="flex gap-2">
                    <Input
                      value={button.title}
                      onChange={(e) => updateQuickReplyButton(index, e.target.value)}
                      placeholder={`Button ${index + 1} text`}
                      maxLength={20}
                      className="flex-1"
                    />
                    {quickReplyButtons.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuickReplyButton(index)}
                        className="h-9 w-9"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {quickReplyButtons.length < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addQuickReplyButton}
                  className="mt-2 w-full"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Button
                </Button>
              )}
            </div>

            <Button
              onClick={handleSendQuickReply}
              disabled={disabled || !quickReplyBody.trim() || quickReplyButtons.some(b => !b.title.trim())}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Quick Reply
            </Button>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div>
              <Label className="text-xs">Message Body</Label>
              <Textarea
                value={listBody}
                onChange={(e) => setListBody(e.target.value)}
                placeholder="Enter your message..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-xs">Button Text</Label>
              <Input
                value={listButtonText}
                onChange={(e) => setListButtonText(e.target.value)}
                placeholder="View Options"
                maxLength={20}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">List Options</Label>
                <Badge variant="secondary" className="text-xs">
                  {listSections[0].rows.length}/10
                </Badge>
              </div>
              <div className="space-y-3">
                {listSections[0].rows.map((row, rowIndex) => (
                  <div key={row.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={row.title}
                        onChange={(e) => updateListRow(0, rowIndex, 'title', e.target.value)}
                        placeholder="Option title"
                        maxLength={24}
                        className="flex-1"
                      />
                      {listSections[0].rows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeListRow(0, rowIndex)}
                          className="h-9 w-9"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={row.description || ''}
                      onChange={(e) => updateListRow(0, rowIndex, 'description', e.target.value)}
                      placeholder="Optional description"
                      maxLength={72}
                    />
                  </div>
                ))}
              </div>
              {listSections[0].rows.length < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addListRow(0)}
                  className="mt-2 w-full"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option
                </Button>
              )}
            </div>

            <Button
              onClick={handleSendList}
              disabled={disabled || !listBody.trim() || !listButtonText.trim() || listSections.some(s => s.rows.some(r => !r.title.trim()))}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Send List Message
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
